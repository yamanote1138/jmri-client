/**
 * Power control manager
 */

import { EventEmitter } from 'events';
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
   */
  async getPower(): Promise<PowerState> {
    const message: PowerMessage = {
      type: 'power'
    };

    const response = await this.client.request<PowerMessage>(message);

    if (response.data?.state !== undefined) {
      this.currentState = response.data.state;
    }

    return this.currentState;
  }

  /**
   * Set track power state
   */
  async setPower(state: PowerState): Promise<void> {
    const message: PowerMessage = {
      type: 'power',
      method: 'post',
      data: { state }
    };

    await this.client.request<PowerMessage>(message);
    this.currentState = state;
  }

  /**
   * Turn track power on
   */
  async powerOn(): Promise<void> {
    await this.setPower(PowerState.ON);
  }

  /**
   * Turn track power off
   */
  async powerOff(): Promise<void> {
    await this.setPower(PowerState.OFF);
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
