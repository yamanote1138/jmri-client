/**
 * Power control manager
 */

import { EventEmitter } from 'eventemitter3';
import { WebSocketClient } from '../core/websocket-client.js';
import { PowerState, PowerMessage } from '../types/jmri-messages.js';

/**
 * Manages track power control
 */
export class PowerManager extends EventEmitter {
  private client: WebSocketClient;
  private currentState: PowerState = PowerState.UNKNOWN;

  constructor(client: WebSocketClient) {
    super();
    this.client = client;

    // Listen for power updates
    this.client.on('update', (message: any) => {
      if (message.type === 'power') {
        this.handlePowerUpdate(message);
      }
    });
  }

  /**
   * Get current track power state
   * @param prefix - Optional JMRI connection prefix to target a specific hardware connection
   */
  async getPower(prefix?: string): Promise<PowerState> {
    const message: PowerMessage = {
      type: 'power',
      ...(prefix !== undefined && { data: { state: PowerState.UNKNOWN, prefix } })
    };

    const response = await this.client.request<PowerMessage>(message);

    if (response.data?.state !== undefined) {
      this.currentState = response.data.state;
    }

    return this.currentState;
  }

  /**
   * Set track power state
   * @param state - The desired power state
   * @param prefix - Optional JMRI connection prefix to target a specific hardware connection
   */
  async setPower(state: PowerState, prefix?: string): Promise<void> {
    const message: PowerMessage = {
      type: 'power',
      method: 'post',
      data: { state, ...(prefix !== undefined && { prefix }) }
    };

    await this.client.request<PowerMessage>(message);

    const oldState = this.currentState;
    this.currentState = state;

    if (oldState !== this.currentState) {
      this.emit('power:changed', this.currentState);
    }
  }

  /**
   * Turn track power on
   * @param prefix - Optional JMRI connection prefix to target a specific hardware connection
   */
  async powerOn(prefix?: string): Promise<void> {
    await this.setPower(PowerState.ON, prefix);
  }

  /**
   * Turn track power off
   * @param prefix - Optional JMRI connection prefix to target a specific hardware connection
   */
  async powerOff(prefix?: string): Promise<void> {
    await this.setPower(PowerState.OFF, prefix);
  }

  /**
   * Get cached power state (no network request)
   */
  getCachedState(): PowerState {
    return this.currentState;
  }

  /**
   * Handle unsolicited power updates from JMRI
   */
  private handlePowerUpdate(message: PowerMessage): void {
    if (message.data?.state !== undefined) {
      const oldState = this.currentState;
      this.currentState = message.data.state;

      if (oldState !== this.currentState) {
        this.emit('power:changed', this.currentState);
      }
    }
  }
}
