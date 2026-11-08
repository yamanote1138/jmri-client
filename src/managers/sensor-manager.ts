// Sensor manager

import { EventEmitter } from 'eventemitter3';
import { WebSocketClient } from '../core/websocket-client.js';
import { SensorState, SettableSensorState, SensorData, SensorMessage } from '../types/jmri-messages.js';

/** Manages JMRI sensor state */
export class SensorManager extends EventEmitter {
  private client: WebSocketClient;
  private sensors: Map<string, SensorState> = new Map();
  private subscribed: Set<string> = new Set();

  constructor(client: WebSocketClient) {
    super();
    this.client = client;

    this.client.on('update', (message: any) => {
      if (message.type === 'sensor') {
        this.handleSensorUpdate(message);
      }
    });

    this.client.on('reconnected', () => {
      void this.resubscribe();
    });
  }

  /** Get a sensor's state by system or user name; cached under the system name JMRI replies with */
  async getSensor(name: string): Promise<SensorState> {
    const message: SensorMessage = {
      type: 'sensor',
      data: { name }
    };

    const response = await this.client.request<SensorMessage>(message);
    const state = response?.data?.state ?? SensorState.UNKNOWN;
    const systemName = response?.data?.name || name;
    const known = this.sensors.has(systemName);
    this.subscribed.add(systemName);
    if (known) {
      this.updateState(systemName, state);
    } else {
      this.sensors.set(systemName, state);
    }
    return state;
  }

  /** Set a sensor to ACTIVE or INACTIVE (JMRI ignores any other state) */
  async setSensor(name: string, state: SettableSensorState): Promise<void> {
    if (state !== SensorState.ACTIVE && state !== SensorState.INACTIVE) {
      throw new Error(`Sensor state must be ACTIVE or INACTIVE, got ${state}`);
    }

    const message: SensorMessage = {
      type: 'sensor',
      method: 'post',
      data: { name, state }
    };

    const response = await this.client.request<SensorMessage>(message);
    const systemName = response?.data?.name || name;
    this.subscribed.add(systemName);
    this.updateState(systemName, response?.data?.state ?? state);
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
    const message: SensorMessage = {
      type: 'sensor',
      method: 'list'
    };

    const response = await this.client.request<any>(message);
    const entries: SensorData[] = Array.isArray(response?.data)
      ? response.data.map((r: any) => r.data ?? r)
      : [];

    for (const entry of entries) {
      if (entry.name && entry.state !== undefined) {
        this.sensors.set(entry.name, entry.state);
      }
    }

    return entries;
  }

  /** Get cached sensor state without a network request */
  getSensorState(name: string): SensorState | undefined {
    return this.sensors.get(name);
  }

  /** Get all cached sensor states */
  getCachedSensors(): Map<string, SensorState> {
    return new Map(this.sensors);
  }

  /** Re-fetch subscribed sensors at once so the new connection gets their changes again */
  private async resubscribe(): Promise<void> {
    await Promise.all([...this.subscribed].map(async name => {
      try {
        const response = await this.client.request<SensorMessage>({ type: 'sensor', data: { name } });
        this.updateState(name, response?.data?.state ?? SensorState.UNKNOWN);
      } catch (error) {
        if ((error as any)?.code === 404) {
          this.subscribed.delete(name);
          this.sensors.delete(name);
        }
        this.emit('error', error);
      }
    }));
  }

  /** Handle unsolicited sensor state updates from JMRI */
  private handleSensorUpdate(message: SensorMessage): void {
    const name = message.data?.name;
    const state = message.data?.state;

    if (!name || state === undefined) return;

    this.updateState(name, state);
  }

  /** Cache a state and emit sensor:changed if it differs */
  private updateState(name: string, state: SensorState): void {
    const oldState = this.sensors.get(name);
    this.sensors.set(name, state);

    if (oldState !== state) {
      this.emit('sensor:changed', name, state);
    }
  }
}
