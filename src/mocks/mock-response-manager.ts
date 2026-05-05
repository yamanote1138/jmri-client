import {
  JmriMessage,
  PowerState,
  PowerMessage,
  ThrottleMessage,
  HelloMessage,
  PongMessage,
  GoodbyeMessage,
  TurnoutState,
  TurnoutMessage,
  LightState,
  LightMessage
} from '../types/jmri-messages.js';
import { mockData } from './mock-data.js';
import { MockConfig, DEFAULT_MOCK_CONFIG } from './mock-config.js';

const POWER_STATE_MAP: Record<string, PowerState> = {
  ON: PowerState.ON,
  OFF: PowerState.OFF,
  UNKNOWN: PowerState.UNKNOWN
};

const LIGHT_STATE_MAP: Record<string, LightState> = {
  ON: LightState.ON,
  OFF: LightState.OFF,
  UNKNOWN: LightState.UNKNOWN
};

const TURNOUT_STATE_MAP: Record<string, TurnoutState> = {
  CLOSED: TurnoutState.CLOSED,
  THROWN: TurnoutState.THROWN,
  UNKNOWN: TurnoutState.UNKNOWN
};

export class MockResponseManager {
  private config: MockConfig;
  private responseDelay: number;
  private powerState: PowerState;
  private throttles: Map<string, any> = new Map();
  private lights: Map<string, LightState>;
  private turnouts: Map<string, TurnoutState>;

  constructor(config: MockConfig = DEFAULT_MOCK_CONFIG) {
    this.config = config;
    this.responseDelay = config.timing?.responseDelay ?? 50;
    this.powerState = POWER_STATE_MAP[config.power?.initialState ?? 'OFF'] ?? PowerState.OFF;
    this.lights = this.buildLightMap();
    this.turnouts = this.buildTurnoutMap();
  }

  private buildLightMap(): Map<string, LightState> {
    const map = new Map<string, LightState>();
    for (const entry of this.config.lights ?? []) {
      map.set(entry.name, LIGHT_STATE_MAP[entry.state ?? 'UNKNOWN'] ?? LightState.UNKNOWN);
    }
    return map;
  }

  private buildTurnoutMap(): Map<string, TurnoutState> {
    const map = new Map<string, TurnoutState>();
    for (const entry of this.config.turnouts ?? []) {
      map.set(entry.name, TURNOUT_STATE_MAP[entry.state ?? 'UNKNOWN'] ?? TurnoutState.UNKNOWN);
    }
    return map;
  }

  async getMockResponse(message: JmriMessage): Promise<JmriMessage | null> {
    if (this.responseDelay > 0) {
      await this.delay(this.responseDelay);
    }

    switch (message.type) {
      case 'hello':    return this.getHelloResponse();
      case 'power':    return this.getPowerResponse(message);
      case 'roster':   return this.getRosterResponse(message);
      case 'throttle': return this.getThrottleResponse(message);
      case 'light':    return this.getLightResponse(message);
      case 'turnout':  return this.getTurnoutResponse(message);
      case 'ping':     return this.getPingResponse();
      case 'goodbye':  return this.getGoodbyeResponse();
      default:         return null;
    }
  }

  private getHelloResponse(): HelloMessage {
    const s = this.config.server ?? DEFAULT_MOCK_CONFIG.server!;
    return {
      type: 'hello',
      data: {
        JMRI: s.jmri ?? '5.9.2',
        json: s.json ?? '5.0',
        version: 'v5',
        heartbeat: s.heartbeat ?? 13500,
        railroad: s.railroad ?? 'Demo Railroad',
        node: s.node ?? 'jmri-server',
        activeProfile: s.activeProfile ?? 'Demo Profile'
      }
    };
  }

  private getPowerResponse(message: JmriMessage): PowerMessage {
    if (message.data?.state !== undefined) {
      this.powerState = message.data.state;
    }
    return { type: 'power', data: { state: this.powerState } };
  }

  private getRosterResponse(message: JmriMessage): JmriMessage {
    if (message.method === 'list') {
      const entries = (this.config.roster ?? []).map((entry, index) => ({
        type: 'rosterEntry',
        data: {
          name: entry.name,
          address: entry.address,
          isLongAddress: entry.isLongAddress ?? false,
          road: entry.road ?? '',
          number: entry.number ?? entry.address,
          mfg: entry.mfg ?? '',
          decoderModel: entry.decoderModel ?? '',
          decoderFamily: entry.decoderFamily ?? '',
          model: entry.model ?? '',
          comment: entry.comment ?? '',
          maxSpeedPct: entry.maxSpeedPct ?? 100,
          image: null,
          icon: `/roster/${entry.name}/icon`,
          shuntingFunction: '',
          owner: '',
          dateModified: new Date().toISOString(),
          functionKeys: (entry.functionKeys ?? []).map(fk => ({
            name: fk.name,
            label: fk.label,
            lockable: fk.lockable ?? false,
            icon: null,
            selectedIcon: null
          })),
          attributes: [],
          rosterGroups: []
        },
        id: index + 1
      }));
      return { type: 'roster', data: entries };
    }
    return { type: 'roster', data: [] };
  }

  private getThrottleResponse(message: JmriMessage): ThrottleMessage {
    const data = message.data || {};

    // Acquire
    if (data.address !== undefined && !data.throttle) {
      const throttleId = data.name || `MOCK-${data.address}`;
      const throttleState = {
        throttle: throttleId,
        address: data.address,
        speed: 0,
        forward: true,
        F0: false, F1: false, F2: false, F3: false, F4: false
      };
      this.throttles.set(throttleId, throttleState);
      return { type: 'throttle', data: { ...throttleState } };
    }

    // Release
    if (data.release !== undefined && data.throttle) {
      this.throttles.delete(data.throttle);
      return { type: 'throttle', data: {} };
    }

    // Control (speed, direction, functions)
    if (data.throttle) {
      const throttleState = this.throttles.get(data.throttle) ?? {
        throttle: data.throttle, address: 0, speed: 0, forward: true
      };
      if (!this.throttles.has(data.throttle)) {
        this.throttles.set(data.throttle, throttleState);
      }
      if (data.speed !== undefined) throttleState.speed = data.speed;
      if (data.forward !== undefined) throttleState.forward = data.forward;
      for (let i = 0; i <= 28; i++) {
        const key = `F${i}`;
        if (data[key] !== undefined) throttleState[key] = data[key];
      }
      return { type: 'throttle', data: {} };
    }

    return { type: 'throttle', data: {} };
  }

  private getLightResponse(message: JmriMessage): LightMessage | JmriMessage {
    if (message.method === 'list') {
      const list = (this.config.lights ?? []).map(entry => ({
        type: 'light',
        data: {
          name: entry.name,
          userName: entry.userName ?? null,
          comment: entry.comment ?? null,
          properties: [],
          state: this.lights.get(entry.name) ?? LightState.UNKNOWN
        }
      }));
      return { type: 'light', data: list };
    }

    const name = message.data?.name;
    if (!name) {
      return { type: 'light', data: { name: '', state: LightState.UNKNOWN } };
    }

    if (message.method === 'post' && message.data?.state !== undefined) {
      this.lights.set(name, message.data.state);
    }

    const state = this.lights.get(name) ?? LightState.UNKNOWN;
    const entry = this.config.lights?.find(l => l.name === name);
    return {
      type: 'light',
      data: { name, userName: entry?.userName ?? null, comment: entry?.comment ?? null, properties: [], state }
    };
  }

  private getTurnoutResponse(message: JmriMessage): TurnoutMessage | JmriMessage {
    if (message.method === 'list') {
      const list = (this.config.turnouts ?? []).map(entry => ({
        type: 'turnout',
        data: {
          name: entry.name,
          userName: entry.userName ?? null,
          comment: entry.comment ?? null,
          state: this.turnouts.get(entry.name) ?? TurnoutState.UNKNOWN
        }
      }));
      return { type: 'turnout', data: list };
    }

    const name = message.data?.name;
    if (!name) {
      return { type: 'turnout', data: { name: '', state: TurnoutState.UNKNOWN } };
    }

    if (message.method === 'post' && message.data?.state !== undefined) {
      this.turnouts.set(name, message.data.state);
    }

    const state = this.turnouts.get(name) ?? TurnoutState.UNKNOWN;
    const entry = this.config.turnouts?.find(t => t.name === name);
    return {
      type: 'turnout',
      data: { name, userName: entry?.userName ?? null, comment: entry?.comment ?? null, state }
    };
  }

  private getPingResponse(): PongMessage {
    return JSON.parse(JSON.stringify(mockData.pong));
  }

  private getGoodbyeResponse(): GoodbyeMessage {
    return JSON.parse(JSON.stringify(mockData.goodbye));
  }

  getPowerState(): PowerState {
    return this.powerState;
  }

  setPowerState(state: PowerState): void {
    this.powerState = state;
  }

  getThrottles(): Map<string, any> {
    return this.throttles;
  }

  getLights(): Map<string, LightState> {
    return this.lights;
  }

  getTurnouts(): Map<string, TurnoutState> {
    return this.turnouts;
  }

  /** Resets all runtime state back to the values defined in the config. */
  reset(): void {
    this.powerState = POWER_STATE_MAP[this.config.power?.initialState ?? 'OFF'] ?? PowerState.OFF;
    this.throttles.clear();
    this.lights = this.buildLightMap();
    this.turnouts = this.buildTurnoutMap();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/** Singleton with zero delay — for use in tests that just need the default layout. */
export const mockResponseManager = new MockResponseManager({
  ...DEFAULT_MOCK_CONFIG,
  timing: { ...DEFAULT_MOCK_CONFIG.timing, responseDelay: 0 }
});
