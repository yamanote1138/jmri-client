/**
 * Throttle control manager
 */

import { EventEmitter } from 'events';
import { WebSocketClient } from '../core/websocket-client.js';
import { ThrottleMessage, ThrottleData } from '../types/jmri-messages.js';
import {
  ThrottleAcquireOptions,
  ThrottleFunctionKey,
  ThrottleState,
  isThrottleFunctionKey,
  isValidSpeed
} from '../types/throttle.js';

/**
 * Manages multiple throttles
 */
export class ThrottleManager extends EventEmitter {
  private client: WebSocketClient;
  private throttles: Map<string, ThrottleState> = new Map();
  private clientId: string;

  constructor(client: WebSocketClient) {
    super();
    this.client = client;
    // Generate a unique client ID
    this.clientId = `jmri-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Listen for throttle updates
    this.client.on('update', (message: any) => {
      if (message.type === 'throttle') {
        this.handleThrottleUpdate(message);
      }
    });

    // Clean up throttles on disconnect
    this.client.on('disconnected', () => {
      this.handleDisconnect();
    });
  }

  /**
   * Acquire a throttle for a locomotive
   */
  async acquireThrottle(options: ThrottleAcquireOptions): Promise<string> {
    // Generate a unique throttle name using client ID and address
    const throttleName = `${this.clientId}-${options.address}`;

    const message: any = {
      type: 'throttle',
      data: {
        name: throttleName,
        address: options.address
      }
    };

    const response = await this.client.request<ThrottleMessage>(message);

    // JMRI returns the throttle ID in the "throttle" field, or we can use our name
    const throttleId = response.data?.throttle || throttleName;

    if (!throttleId) {
      throw new Error('Failed to acquire throttle: no throttle ID returned');
    }

    // Initialize throttle state
    const state: ThrottleState = {
      id: throttleId,
      address: options.address,
      speed: 0,
      forward: true,
      functions: new Map(),
      acquired: true
    };

    this.throttles.set(throttleId, state);
    this.emit('throttle:acquired', throttleId);

    return throttleId;
  }

  /**
   * Release a throttle
   */
  async releaseThrottle(throttleId: string): Promise<void> {
    const state = this.throttles.get(throttleId);
    if (!state) {
      throw new Error(`Throttle not found: ${throttleId}`);
    }

    const message: ThrottleMessage = {
      type: 'throttle',
      data: {
        throttle: throttleId,
        release: null
      }
    };

    await this.client.request<ThrottleMessage>(message);

    this.throttles.delete(throttleId);
    this.emit('throttle:released', throttleId);
  }

  /**
   * Set throttle speed (0.0 to 1.0)
   */
  async setSpeed(throttleId: string, speed: number): Promise<void> {
    const state = this.throttles.get(throttleId);
    if (!state) {
      throw new Error(`Throttle not found: ${throttleId}`);
    }

    if (!isValidSpeed(speed)) {
      throw new Error(`Invalid speed: ${speed}. Must be between 0.0 and 1.0`);
    }

    const message: ThrottleMessage = {
      type: 'throttle',
      data: {
        throttle: throttleId,
        speed
      }
    };

    // JMRI doesn't send responses for throttle control commands, just send
    this.client.send(message);

    state.speed = speed;
    this.emit('throttle:updated', throttleId, { speed });
  }

  /**
   * Set throttle direction
   */
  async setDirection(throttleId: string, forward: boolean): Promise<void> {
    const state = this.throttles.get(throttleId);
    if (!state) {
      throw new Error(`Throttle not found: ${throttleId}`);
    }

    const message: ThrottleMessage = {
      type: 'throttle',
      data: {
        throttle: throttleId,
        forward
      }
    };

    // JMRI doesn't send responses for throttle control commands, just send
    this.client.send(message);

    state.forward = forward;
    this.emit('throttle:updated', throttleId, { forward });
  }

  /**
   * Set throttle function (F0-F28)
   */
  async setFunction(throttleId: string, functionKey: ThrottleFunctionKey, value: boolean): Promise<void> {
    const state = this.throttles.get(throttleId);
    if (!state) {
      throw new Error(`Throttle not found: ${throttleId}`);
    }

    if (!isThrottleFunctionKey(functionKey)) {
      throw new Error(`Invalid function key: ${functionKey}`);
    }

    const data: ThrottleData = {
      throttle: throttleId,
      [functionKey]: value
    };

    const message: ThrottleMessage = {
      type: 'throttle',
      data
    };

    // JMRI doesn't send responses for throttle control commands, just send
    this.client.send(message);

    state.functions.set(functionKey, value);
    this.emit('throttle:updated', throttleId, { [functionKey]: value });
  }

  /**
   * Emergency stop for a throttle (speed to 0)
   */
  async emergencyStop(throttleId: string): Promise<void> {
    await this.setSpeed(throttleId, 0);
  }

  /**
   * Set throttle to idle (speed to 0, maintain direction)
   */
  async idle(throttleId: string): Promise<void> {
    await this.setSpeed(throttleId, 0);
  }

  /**
   * Get throttle state
   */
  getThrottleState(throttleId: string): ThrottleState | undefined {
    return this.throttles.get(throttleId);
  }

  /**
   * Get all throttle IDs
   */
  getThrottleIds(): string[] {
    return Array.from(this.throttles.keys());
  }

  /**
   * Get all throttle states
   */
  getAllThrottles(): ThrottleState[] {
    return Array.from(this.throttles.values());
  }

  /**
   * Release all throttles
   */
  async releaseAllThrottles(): Promise<void> {
    const throttleIds = this.getThrottleIds();

    for (const throttleId of throttleIds) {
      try {
        await this.releaseThrottle(throttleId);
      } catch (error) {
        // Continue releasing others even if one fails
        this.emit('error', error);
      }
    }
  }

  /**
   * Handle unsolicited throttle updates from JMRI
   */
  private handleThrottleUpdate(message: ThrottleMessage): void {
    const throttleId = message.data?.throttle;
    if (!throttleId) {
      return;
    }

    const state = this.throttles.get(throttleId);
    if (!state) {
      // Unknown throttle, possibly lost
      this.emit('throttle:lost', throttleId);
      return;
    }

    // Update state from message
    if (message.data.speed !== undefined) {
      state.speed = message.data.speed;
    }

    if (message.data.forward !== undefined) {
      state.forward = message.data.forward;
    }

    // Update functions
    for (let i = 0; i <= 28; i++) {
      const key = `F${i}` as ThrottleFunctionKey;
      if (message.data[key] !== undefined) {
        state.functions.set(key, message.data[key]!);
      }
    }

    this.emit('throttle:updated', throttleId, message.data);
  }

  /**
   * Handle disconnect - mark all throttles as not acquired
   */
  private handleDisconnect(): void {
    for (const state of this.throttles.values()) {
      state.acquired = false;
    }
  }
}
