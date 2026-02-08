/**
 * Automatic reconnection management with exponential backoff
 */

import { EventEmitter } from 'events';
import { ReconnectionOptions } from '../types/client-options.js';
import { calculateBackoffDelay, shouldReconnect } from '../utils/exponential-backoff.js';

/**
 * Manages automatic reconnection with exponential backoff
 */
export class ReconnectionManager extends EventEmitter {
  private options: ReconnectionOptions;
  private currentAttempt: number = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private isReconnecting: boolean = false;

  constructor(options: ReconnectionOptions) {
    super();
    this.options = options;
  }

  /**
   * Start reconnection process
   * @param reconnect - Callback to attempt reconnection
   */
  start(reconnect: () => Promise<void>): void {
    if (!this.options.enabled || this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    this.currentAttempt = 0;
    this.scheduleNextAttempt(reconnect);
  }

  /**
   * Schedule next reconnection attempt
   */
  private scheduleNextAttempt(reconnect: () => Promise<void>): void {
    this.currentAttempt++;

    // Check if should continue trying
    if (!shouldReconnect(this.currentAttempt, this.options.maxAttempts)) {
      this.emit('maxAttemptsReached', this.currentAttempt - 1);
      this.stop();
      return;
    }

    // Calculate delay with backoff
    const delay = calculateBackoffDelay(this.currentAttempt, this.options);

    this.emit('attemptScheduled', this.currentAttempt, delay);

    // Schedule attempt
    this.reconnectTimeout = setTimeout(async () => {
      console.log('🔴🔴🔴 [ReconnectionManager] setTimeout fired, attempt', this.currentAttempt, '🔴🔴🔴');
      this.emit('attempting', this.currentAttempt);
      this.emit('debug', `[ReconnectionManager] Calling reconnect() for attempt ${this.currentAttempt}`);

      try {
        console.log('🔴 [ReconnectionManager] About to call reconnect(), type:', typeof reconnect);
        this.emit('debug', '[ReconnectionManager] About to await reconnect()');
        await reconnect();
        console.log('🔴 [ReconnectionManager] reconnect() returned successfully');
        this.emit('debug', '[ReconnectionManager] reconnect() succeeded');
        // Success - stop reconnection process
        this.stop();
        this.emit('success', this.currentAttempt);
      } catch (error) {
        // Failure - schedule next attempt
        this.emit('debug', `[ReconnectionManager] reconnect() failed: ${error}`);
        this.emit('failed', this.currentAttempt, error);
        this.scheduleNextAttempt(reconnect);
      }
    }, delay);
  }

  /**
   * Stop reconnection process
   */
  stop(): void {
    this.isReconnecting = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  /**
   * Reset attempt counter
   */
  reset(): void {
    this.stop();
    this.currentAttempt = 0;
  }

  /**
   * Check if currently reconnecting
   */
  reconnecting(): boolean {
    return this.isReconnecting;
  }

  /**
   * Get current attempt number
   */
  getAttempt(): number {
    return this.currentAttempt;
  }

  /**
   * Update reconnection options
   */
  updateOptions(options: Partial<ReconnectionOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
