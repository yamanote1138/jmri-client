/**
 * Sensor manager
 */

import { EventEmitter } from 'eventemitter3';
import { WebSocketClient } from '../core/websocket-client.js';
import { SensorState, SettableSensorState, SensorData, SensorMessage } from '../types/jmri-messages.js';

/**
 * Manages JMRI sensor state
 */
export class SensorManager extends EventEmitter {
  private client: WebSocketClient;
  private sensors: Map<string, SensorState> = new Map();

  constructor(client: WebSocketClient) {
    super();
    this.client = client;

    this.client.on('update', (message: any) => {
      if (message.type === 'sensor') {
        this.handleSensorUpdate(message);
      }
    });
  }

  /**
   * Get the current state of a sensor.
   * Also registers a server-side listener so subsequent changes are pushed.
   */
  async getSensor(name: string): Promise<SensorState> {
    const message: SensorMessage = {
      type: 'sensor',
      data: { name }
    };

    const response = await this.client.request<SensorMessage>(message);
    const state = response.data?.state ?? SensorState.UNKNOWN;
    this.sensors.set(name, state);
    return state;
  }

  /**
   * Set a sensor to ACTIVE or INACTIVE (JMRI ignores any other state)
   */
  async setSensor(name: string, state: SettableSensorState): Promise<void> {
    if (state !== SensorState.ACTIVE && state !== SensorState.INACTIVE) {
      throw new Error(`Sensor state must be ACTIVE or INACTIVE, got ${state}`);
    }

    const message: SensorMessage = {
      type: 'sensor',
      method: 'post',
      data: { name, state }
    };

    await this.client.request<SensorMessage>(message);

    const oldState = this.sensors.get(name);
    this.sensors.set(name, state);

    if (oldState !== state) {
      this.emit('sensor:changed', name, state);
    }
  }

  /**
   * Set a sensor to ACTIVE
   */
  async setSensorActive(name: string): Promise<void> {
    return this.setSensor(name, SensorState.ACTIVE);
  }

  /**
   * Set a sensor to INACTIVE
   */
  async setSensorInactive(name: string): Promise<void> {
    return this.setSensor(name, SensorState.INACTIVE);
  }

  /**
   * List all sensors known to JMRI
   */
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

  /**
   * Get cached sensor state without a network request
   */
  getSensorState(name: string): SensorState | undefined {
    return this.sensors.get(name);
  }

  /**
   * Get all cached sensor states
   */
  getCachedSensors(): Map<string, SensorState> {
    return new Map(this.sensors);
  }

  /**
   * Handle unsolicited sensor state updates from JMRI
   */
  private handleSensorUpdate(message: SensorMessage): void {
    const name = message.data?.name;
    const state = message.data?.state;

    if (!name || state === undefined) return;

    const oldState = this.sensors.get(name);
    this.sensors.set(name, state);

    if (oldState !== state) {
      this.emit('sensor:changed', name, state);
    }
  }
}
