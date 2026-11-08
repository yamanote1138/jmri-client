// Light manager

import { WebSocketClient } from '../core/websocket-client.js';
import { LightState, LightData } from '../types/jmri-messages.js';
import { NamedObjectManager } from './named-object-manager.js';

/** Manages JMRI light state */
export class LightManager extends NamedObjectManager<LightState, LightData> {
  constructor(client: WebSocketClient) {
    super(client, 'light', 'light:changed', LightState.UNKNOWN);
  }

  /** Get a light's state by system or user name; JMRI then pushes its changes */
  async getLight(name: string): Promise<LightState> {
    return this.fetchState(name);
  }

  /** Set a light to the given state */
  async setLight(name: string, state: LightState): Promise<void> {
    return this.postState(name, state);
  }

  /** Turn a light on */
  async turnOnLight(name: string): Promise<void> {
    return this.setLight(name, LightState.ON);
  }

  /** Turn a light off */
  async turnOffLight(name: string): Promise<void> {
    return this.setLight(name, LightState.OFF);
  }

  /** List all lights known to JMRI (does not subscribe to their changes) */
  async listLights(): Promise<LightData[]> {
    return this.listAll();
  }

  /** Get cached light state without a network request */
  getLightState(name: string): LightState | undefined {
    return this.cachedState(name);
  }

  /** Get all cached light states */
  getCachedLights(): Map<string, LightState> {
    return this.cachedStates();
  }
}
