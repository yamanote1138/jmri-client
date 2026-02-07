/**
 * Core WebSocket client for JMRI communication
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { JmriClientOptions } from '../types/client-options.js';
import { JmriMessage, AnyJmriMessage, GoodbyeMessage } from '../types/jmri-messages.js';
import { ConnectionState } from '../types/events.js';
import { MessageIdGenerator } from '../utils/message-id.js';
import { MessageQueue } from './message-queue.js';
import { ConnectionStateManager } from './connection-state-manager.js';
import { HeartbeatManager } from './heartbeat-manager.js';
import { ReconnectionManager } from './reconnection-manager.js';
import { MockResponseManager } from '../mocks/index.js';

/**
 * Pending request tracking
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  messageType?: string;
  matchKey?: string;
}

/**
 * Core WebSocket client
 */
export class WebSocketClient extends EventEmitter {
  private options: JmriClientOptions;
  private ws?: WebSocket;
  private url: string;

  // Sub-managers
  private messageIdGen: MessageIdGenerator;
  private messageQueue: MessageQueue;
  private stateManager: ConnectionStateManager;
  private heartbeatManager: HeartbeatManager;
  private reconnectionManager: ReconnectionManager;
  private mockManager?: MockResponseManager;

  // Request/response tracking
  private pendingRequests: Map<number, PendingRequest> = new Map();

  // Connection state
  private isManualDisconnect: boolean = false;

  constructor(options: JmriClientOptions) {
    super();
    this.options = options;
    this.url = `${options.protocol}://${options.host}:${options.port}/json/`;

    // Initialize sub-managers
    this.messageIdGen = new MessageIdGenerator();
    this.messageQueue = new MessageQueue(options.messageQueueSize);
    this.stateManager = new ConnectionStateManager();
    this.heartbeatManager = new HeartbeatManager(options.heartbeat);
    this.reconnectionManager = new ReconnectionManager(options.reconnection);

    // Initialize mock manager if mock mode is enabled
    if (options.mock.enabled) {
      this.mockManager = new MockResponseManager({
        responseDelay: options.mock.responseDelay
      });
    }

    // Wire up state manager events
    this.stateManager.on('stateChanged', (newState: ConnectionState, prevState: ConnectionState) => {
      this.emit('connectionStateChanged', newState, prevState);
    });

    // Wire up heartbeat events
    this.heartbeatManager.on('timeout', () => {
      this.emit('heartbeat:timeout');
      this.handleHeartbeatTimeout();
    });

    this.heartbeatManager.on('pingSent', () => {
      this.emit('heartbeat:sent');
    });

    // Wire up reconnection events
    this.reconnectionManager.on('attemptScheduled', (attempt: number, delay: number) => {
      this.emit('reconnecting', attempt, delay);
    });

    this.reconnectionManager.on('success', () => {
      this.emit('reconnected');
    });

    this.reconnectionManager.on('maxAttemptsReached', (attempts: number) => {
      this.emit('reconnectionFailed', attempts);
    });
  }

  /**
   * Connect to JMRI WebSocket server (or mock)
   */
  async connect(): Promise<void> {
    if (this.stateManager.isConnected() || this.stateManager.isConnecting()) {
      return;
    }

    this.isManualDisconnect = false;
    this.stateManager.transition(ConnectionState.CONNECTING);

    // Mock mode - simulate connection
    if (this.mockManager) {
      return this.connectMock();
    }

    // Real WebSocket connection
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.handleOpen();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data);
        });

        this.ws.on('close', (code: number, reason: Buffer) => {
          this.handleClose(code, reason.toString());
        });

        this.ws.on('error', (error: Error) => {
          this.handleError(error);
          if (this.stateManager.isConnecting()) {
            reject(error);
          }
        });
      } catch (error) {
        this.stateManager.transition(ConnectionState.DISCONNECTED);
        reject(error);
      }
    });
  }

  /**
   * Simulate connection in mock mode
   */
  private async connectMock(): Promise<void> {
    // Simulate connection delay
    await this.delay(10);

    // Transition to connected state
    this.handleOpen();

    // Send hello message in mock mode
    const helloResponse = await this.mockManager!.getMockResponse({ type: 'hello' });
    if (helloResponse) {
      this.emit('message:received', helloResponse);
    }
  }

  /**
   * Disconnect from JMRI WebSocket server
   */
  async disconnect(): Promise<void> {
    // Already disconnected, nothing to do
    if (this.stateManager.isDisconnected()) {
      return;
    }

    this.isManualDisconnect = true;
    this.reconnectionManager.stop();
    this.heartbeatManager.stop();

    // Send goodbye message
    if (this.stateManager.isConnected()) {
      try {
        await this.sendGoodbye();
      } catch (error) {
        // Ignore errors during goodbye
      }
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    // Reject all pending requests
    this.rejectAllPendingRequests(new Error('Client disconnected'));

    if (!this.stateManager.isDisconnected()) {
      this.stateManager.transition(ConnectionState.DISCONNECTED);
    }
  }

  /**
   * Send message to JMRI (or mock)
   */
  send(message: JmriMessage): void {
    if (!this.stateManager.isConnected()) {
      // Queue message for later
      this.messageQueue.enqueue(message);
      return;
    }

    // Mock mode - send doesn't need to do anything
    // Responses are generated in request()
    if (this.mockManager) {
      this.emit('message:sent', message);
      return;
    }

    if (!this.ws) {
      throw new Error('WebSocket not initialized');
    }

    const json = JSON.stringify(message);
    this.ws.send(json);
    this.emit('message:sent', message);
  }

  /**
   * Send request and wait for response (or get mock response)
   */
  async request<T = any>(message: JmriMessage, timeout?: number): Promise<T> {
    // Mock mode - get response from mock manager
    if (this.mockManager) {
      const response = await this.mockManager.getMockResponse(message);
      this.emit('message:sent', message);
      if (response) {
        this.emit('message:received', response);
      }
      return response as T;
    }

    // Real mode - send request and wait for response
    // Assign message ID
    const id = this.messageIdGen.next();
    message.id = id;

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutMs = timeout || this.options.requestTimeout;
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Track pending request with metadata for matching responses without IDs
      const pendingRequest: PendingRequest = {
        resolve,
        reject,
        timeout: timeoutHandle,
        messageType: message.type
      };

      // For throttle requests, store the throttle name for matching
      if (message.type === 'throttle' && message.data && 'name' in message.data) {
        pendingRequest.matchKey = (message.data as any).name;
      }

      this.pendingRequests.set(id, pendingRequest);

      // Send message
      try {
        this.send(message);
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.stateManager.getState();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.stateManager.isConnected();
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.stateManager.transition(ConnectionState.CONNECTED);
    this.emit('connected');

    // Start heartbeat
    if (this.options.heartbeat.enabled) {
      this.heartbeatManager.start(() => this.sendPing());
    }

    // Flush queued messages
    const queuedMessages = this.messageQueue.flush();
    for (const message of queuedMessages) {
      this.send(message);
    }
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message: AnyJmriMessage = JSON.parse(data.toString());
      this.emit('message:received', message);

      // Handle pong
      if (message.type === 'pong') {
        this.heartbeatManager.receivedPong();
        return;
      }

      // Handle hello
      if (message.type === 'hello') {
        this.emit('hello', message.data);
        return;
      }

      // Handle response to request
      if (message.id !== undefined) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(message.id);
          pending.resolve(message);
          return;
        }
      }

      // Handle responses without ID (like throttle responses from JMRI)
      // Match by message type and data
      if (message.id === undefined) {
        for (const [id, pending] of this.pendingRequests.entries()) {
          // Match by type
          if (pending.messageType === message.type) {
            // For throttle messages, also match by throttle name
            if (message.type === 'throttle' && pending.matchKey) {
              const throttleName = (message.data as any)?.throttle || (message.data as any)?.name;
              if (throttleName === pending.matchKey) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(id);
                pending.resolve(message);
                return;
              }
            } else {
              // For other message types, just match by type
              clearTimeout(pending.timeout);
              this.pendingRequests.delete(id);
              pending.resolve(message);
              return;
            }
          }
        }
      }

      // Handle unsolicited updates (auto-subscriptions)
      this.emit('update', message);
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(code: number, reason: string): void {
    this.heartbeatManager.stop();

    const wasConnected = this.stateManager.isConnected();

    if (this.stateManager.isConnected() || this.stateManager.isConnecting()) {
      this.stateManager.transition(ConnectionState.DISCONNECTED);
    }

    this.emit('disconnected', reason || `Connection closed (code: ${code})`);

    // Reject all pending requests
    this.rejectAllPendingRequests(new Error('Connection closed'));

    // Attempt reconnection if not manual disconnect
    if (!this.isManualDisconnect && wasConnected && this.options.reconnection.enabled) {
      this.stateManager.forceState(ConnectionState.RECONNECTING);
      this.reconnectionManager.start(() => this.connect());
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Handle heartbeat timeout
   */
  private handleHeartbeatTimeout(): void {
    // Connection appears dead, force reconnect
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Send ping message
   */
  private sendPing(): void {
    this.send({ type: 'ping' });
  }

  /**
   * Send goodbye message
   */
  private async sendGoodbye(): Promise<void> {
    const message: GoodbyeMessage = { type: 'goodbye' };
    this.send(message);
    // Give it a moment to send
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Reject all pending requests
   */
  private rejectAllPendingRequests(error: Error): void {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
