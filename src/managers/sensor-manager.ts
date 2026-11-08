// Sensor manager

import { WebSocketClient } from '../core/websocket-client.js';
import { SensorState, SettableSensorState, SensorData } from '../types/jmri-messages.js';
import { NamedObjectManager } from './named-object-manager.js';

/** Manages JMRI sensor state */
export class SensorManager extends NamedObjectManager<SensorState, SensorData> {
  constructor(client: WebSocketClient) {
    super(client, 'sensor', 'sensor:changed', SensorState.UNKNOWN);
  }

  /** Get a sensor's state by system or user name; cached under the system name JMRI replies with */
  async getSensor(name: string): Promise<SensorState> {
    return this.fetchState(name);
  }

  /** Set a sensor to ACTIVE or INACTIVE (JMRI ignores any other state) */
  async setSensor(name: string, state: SettableSensorState): Promise<void> {
    if (state !== SensorState.ACTIVE && state !== SensorState.INACTIVE) {
      throw new Error(`Sensor state must be ACTIVE or INACTIVE, got ${state}`);
    }
    return this.postState(name, state);
  }

  /** Set a sensor to ACTIVE */
  async setSensorActive(name: string): Promise<void> {
    return this.setSensor(name, SensorState.ACTIVE);
  }

  /** Set a sensor to INACTIVE */
  async setSensorInactive(name: string): Promise<void> {
    return this.setSensor(name, SensorState.INACTIVE);
  }

  /** List all sensors known to JMRI (does not subscribe to their changes) */
  async listSensors(): Promise<SensorData[]> {
    return this.listAll();
  }

  /** Get cached sensor state without a network request */
  getSensorState(name: string): SensorState | undefined {
    return this.cachedState(name);
  }

  /** Get all cached sensor states */
  getCachedSensors(): Map<string, SensorState> {
    return this.cachedStates();
  }
}
