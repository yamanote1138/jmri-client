/**
 * Light manager
 */

import { EventEmitter } from 'eventemitter3';
import { WebSocketClient } from '../core/websocket-client.js';
import { LightState, LightData, LightMessage } from '../types/jmri-messages.js';

/**
 * Manages JMRI light state
 */
export class LightManager extends EventEmitter {
  private client: WebSocketClient;
  private lights: Map<string, LightState> = new Map();

  constructor(client: WebSocketClient) {
    super();
    this.client = client;

    this.client.on('update', (message: any) => {
      if (message.type === 'light') {
        this.handleLightUpdate(message);
      }
    });
  }

  /**
   * Get the current state of a light.
   * Also registers a server-side listener so subsequent changes are pushed.
   */
  async getLight(name: string): Promise<LightState> {
    const message: LightMessage = {
      type: 'light',
      data: { name }
    };

    const response = await this.client.request<LightMessage>(message);
    const state = response.data?.state ?? LightState.UNKNOWN;
    this.lights.set(name, state);
    return state;
  }

  /**
   * Set a light to the given state
   */
  async setLight(name: string, state: LightState): Promise<void> {
    const message: LightMessage = {
      type: 'light',
      method: 'post',
      data: { name, state }
    };

    await this.client.request<LightMessage>(message);

    const oldState = this.lights.get(name);
    this.lights.set(name, state);

    if (oldState !== state) {
      this.emit('light:changed', name, state);
    }
  }

  /**
   * Turn a light on
   */
  async turnOnLight(name: string): Promise<void> {
    return this.setLight(name, LightState.ON);
  }

  /**
   * Turn a light off
   */
  async turnOffLight(name: string): Promise<void> {
    return this.setLight(name, LightState.OFF);
  }

  /**
   * List all lights known to JMRI
   */
  async listLights(): Promise<LightData[]> {
    const message: LightMessage = {
      type: 'light',
      method: 'list'
    };

    const response = await this.client.request<any>(message);
    const entries: LightData[] = Array.isArray(response?.data)
      ? response.data.map((r: any) => r.data ?? r)
      : [];

    for (const entry of entries) {
      if (entry.name && entry.state !== undefined) {
        this.lights.set(entry.name, entry.state);
      }
    }

    return entries;
  }

  /**
   * Get cached light state without a network request
   */
  getLightState(name: string): LightState | undefined {
    return this.lights.get(name);
  }

  /**
   * Get all cached light states
   */
  getCachedLights(): Map<string, LightState> {
    return new Map(this.lights);
  }

  /**
   * Handle unsolicited light state updates from JMRI
   */
  private handleLightUpdate(message: LightMessage): void {
    const name = message.data?.name;
    const state = message.data?.state;

    if (!name || state === undefined) return;

    const oldState = this.lights.get(name);
    this.lights.set(name, state);

    if (oldState !== state) {
      this.emit('light:changed', name, state);
    }
  }
}
