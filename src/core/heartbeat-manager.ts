/**
 * Heartbeat (ping/pong) management
 */

import { EventEmitter } from 'events';
import { HeartbeatOptions } from '../types/client-options.js';

/**
 * Manages WebSocket heartbeat via ping/pong
 */
export class HeartbeatManager extends EventEmitter {
  private options: HeartbeatOptions;
  private pingInterval?: NodeJS.Timeout;
  private pongTimeout?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(options: HeartbeatOptions) {
    super();
    this.options = options;
  }

  /**
   * Start heartbeat monitoring
   * @param sendPing - Callback to send ping message
   */
  start(sendPing: () => void): void {
    if (!this.options.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Send ping at regular intervals
    this.pingInterval = setInterval(() => {
      sendPing();
      this.emit('pingSent');

      // Start pong timeout
      this.pongTimeout = setTimeout(() => {
        this.emit('timeout');
      }, this.options.timeout);
    }, this.options.interval);
  }

  /**
   * Stop heartbeat monitoring
   */
  stop(): void {
    this.isRunning = false;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
  }

  /**
   * Handle pong received from server
   */
  receivedPong(): void {
    // Clear pong timeout
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
    this.emit('pongReceived');
  }

  /**
   * Check if heartbeat is running
   */
  running(): boolean {
    return this.isRunning;
  }

  /**
   * Update heartbeat options
   */
  updateOptions(options: Partial<HeartbeatOptions>): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.options = { ...this.options, ...options };

    // Note: Caller must call start() again if needed
  }
}
