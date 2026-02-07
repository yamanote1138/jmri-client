/**
 * Connection state management with state machine
 */

import { EventEmitter } from 'events';
import { ConnectionState } from '../types/events.js';

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
  [ConnectionState.DISCONNECTED]: [ConnectionState.CONNECTING],
  [ConnectionState.CONNECTING]: [ConnectionState.CONNECTED, ConnectionState.DISCONNECTED],
  [ConnectionState.CONNECTED]: [ConnectionState.DISCONNECTED, ConnectionState.RECONNECTING],
  [ConnectionState.RECONNECTING]: [ConnectionState.CONNECTING, ConnectionState.CONNECTED, ConnectionState.DISCONNECTED]
};

/**
 * Manages connection state with validation
 */
export class ConnectionStateManager extends EventEmitter {
  private currentState: ConnectionState = ConnectionState.DISCONNECTED;

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.currentState;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.currentState === ConnectionState.CONNECTED;
  }

  /**
   * Check if currently connecting
   */
  isConnecting(): boolean {
    return this.currentState === ConnectionState.CONNECTING;
  }

  /**
   * Check if currently disconnected
   */
  isDisconnected(): boolean {
    return this.currentState === ConnectionState.DISCONNECTED;
  }

  /**
   * Check if currently reconnecting
   */
  isReconnecting(): boolean {
    return this.currentState === ConnectionState.RECONNECTING;
  }

  /**
   * Transition to new state
   * Validates transition and emits event
   */
  transition(newState: ConnectionState): void {
    const validTransitions = VALID_TRANSITIONS[this.currentState];

    if (!validTransitions.includes(newState)) {
      throw new Error(
        `Invalid state transition: ${this.currentState} -> ${newState}`
      );
    }

    const previousState = this.currentState;
    this.currentState = newState;

    this.emit('stateChanged', newState, previousState);
  }

  /**
   * Force state without validation (use with caution)
   */
  forceState(newState: ConnectionState): void {
    const previousState = this.currentState;
    this.currentState = newState;
    this.emit('stateChanged', newState, previousState);
  }

  /**
   * Reset to disconnected state
   */
  reset(): void {
    this.forceState(ConnectionState.DISCONNECTED);
  }
}
