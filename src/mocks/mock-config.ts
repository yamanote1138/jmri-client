export interface MockServerConfig {
  jmri?: string;
  json?: string;
  heartbeat?: number;
  railroad?: string;
  node?: string;
  activeProfile?: string;
}

export interface MockFunctionKey {
  name: string;
  label: string | null;
  lockable?: boolean;
}

export interface MockRosterEntry {
  name: string;
  address: string;
  isLongAddress?: boolean;
  road?: string;
  number?: string;
  mfg?: string;
  decoderModel?: string;
  decoderFamily?: string;
  model?: string;
  comment?: string;
  maxSpeedPct?: number;
  functionKeys?: MockFunctionKey[];
}

export interface MockLightEntry {
  name: string;
  userName?: string;
  state?: 'ON' | 'OFF' | 'UNKNOWN';
  comment?: string;
}

export interface MockTurnoutEntry {
  name: string;
  userName?: string;
  state?: 'CLOSED' | 'THROWN' | 'UNKNOWN';
  comment?: string;
}

export interface MockTimingConfig {
  /** Delay in ms before returning responses. Simulates network latency. Default: 50 */
  responseDelay?: number;
  /** Delay in ms for mock connection handshake. Default: 10 */
  connectionDelay?: number;
}

export interface MockConfig {
  server?: MockServerConfig;
  power?: {
    initialState?: 'ON' | 'OFF' | 'UNKNOWN';
  };
  roster?: MockRosterEntry[];
  lights?: MockLightEntry[];
  turnouts?: MockTurnoutEntry[];
  timing?: MockTimingConfig;
}

export const DEFAULT_MOCK_CONFIG: MockConfig = {
  server: {
    jmri: '5.9.2',
    json: '5.0',
    heartbeat: 13500,
    railroad: 'Demo Railroad',
    node: 'jmri-server',
    activeProfile: 'Demo Profile'
  },
  power: {
    initialState: 'OFF'
  },
  roster: [
    {
      name: 'CSX754',
      address: '754',
      isLongAddress: true,
      road: 'CSX',
      number: '754',
      mfg: 'Athearn',
      decoderModel: 'DH163D',
      decoderFamily: 'Digitrax DH163',
      model: 'GP38-2',
      comment: 'Blue and yellow scheme',
      maxSpeedPct: 100,
      functionKeys: [
        { name: 'F0', label: 'Headlight', lockable: true },
        { name: 'F1', label: 'Bell', lockable: true },
        { name: 'F2', label: 'Horn', lockable: false },
        { name: 'F3', label: null, lockable: false },
        { name: 'F4', label: 'Dynamic Brake', lockable: true },
        { name: 'F5', label: null, lockable: false }
      ]
    },
    {
      name: 'UP3985',
      address: '3985',
      isLongAddress: true,
      road: 'Union Pacific',
      number: '3985',
      mfg: 'Rivarossi',
      decoderModel: 'Sound decoder',
      decoderFamily: 'ESU LokSound',
      model: 'Challenger 4-6-6-4',
      comment: 'Steam locomotive',
      maxSpeedPct: 100,
      functionKeys: [
        { name: 'F0', label: 'Headlight', lockable: true },
        { name: 'F1', label: 'Bell', lockable: true },
        { name: 'F2', label: 'Whistle', lockable: false },
        { name: 'F3', label: 'Steam', lockable: true },
        { name: 'F4', label: null, lockable: false }
      ]
    },
    {
      name: 'BNSF5240',
      address: '5240',
      isLongAddress: true,
      road: 'BNSF',
      number: '5240',
      mfg: 'Kato',
      decoderModel: 'DCC Sound',
      decoderFamily: 'Kato',
      model: 'SD40-2',
      comment: 'Heritage II paint',
      maxSpeedPct: 100,
      functionKeys: [
        { name: 'F0', label: 'Headlight', lockable: true },
        { name: 'F1', label: 'Bell', lockable: true },
        { name: 'F2', label: 'Horn', lockable: false },
        { name: 'F3', label: 'Dynamic Brake', lockable: true },
        { name: 'F4', label: null, lockable: false },
        { name: 'F5', label: 'Mars Light', lockable: true }
      ]
    }
  ],
  lights: [
    { name: 'IL1', userName: 'Yard Light', state: 'OFF' },
    { name: 'IL2', userName: 'Platform Light', state: 'OFF' },
    { name: 'IL3', userName: 'Signal Lamp', state: 'ON' }
  ],
  turnouts: [
    { name: 'LT1', userName: 'Main Diverge', state: 'CLOSED' },
    { name: 'LT2', userName: 'Yard Lead', state: 'CLOSED' },
    { name: 'LT3', userName: 'Siding Entry', state: 'THROWN' }
  ],
  timing: {
    responseDelay: 50,
    connectionDelay: 10
  }
};
