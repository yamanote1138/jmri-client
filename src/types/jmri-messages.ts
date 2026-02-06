/**
 * JMRI WebSocket Protocol Message Types
 * Based on JMRI JSON protocol specification
 */

/**
 * Base message structure for JMRI WebSocket communication
 */
export interface JmriMessage {
  type: string;
  method?: 'get' | 'post' | 'put' | 'delete' | 'list';
  data?: any;
  id?: number;
}

/**
 * Power state values
 * ON = 2, OFF = 4 (JMRI constants)
 */
export enum PowerState {
  ON = 2,
  OFF = 4,
  UNKNOWN = 0
}

/**
 * Power message data
 */
export interface PowerData {
  state: PowerState;
}

/**
 * Power message
 */
export interface PowerMessage extends JmriMessage {
  type: 'power';
  data?: PowerData;
}

/**
 * Throttle data structure
 */
export interface ThrottleData {
  address?: number | string;
  throttle?: string;
  speed?: number;
  forward?: boolean;
  release?: null;
  status?: string;
  // Function keys F0-F28
  F0?: boolean;
  F1?: boolean;
  F2?: boolean;
  F3?: boolean;
  F4?: boolean;
  F5?: boolean;
  F6?: boolean;
  F7?: boolean;
  F8?: boolean;
  F9?: boolean;
  F10?: boolean;
  F11?: boolean;
  F12?: boolean;
  F13?: boolean;
  F14?: boolean;
  F15?: boolean;
  F16?: boolean;
  F17?: boolean;
  F18?: boolean;
  F19?: boolean;
  F20?: boolean;
  F21?: boolean;
  F22?: boolean;
  F23?: boolean;
  F24?: boolean;
  F25?: boolean;
  F26?: boolean;
  F27?: boolean;
  F28?: boolean;
}

/**
 * Throttle message
 */
export interface ThrottleMessage extends JmriMessage {
  type: 'throttle';
  data: ThrottleData;
}

/**
 * Roster entry
 */
export interface RosterEntry {
  name: string;
  address: string;
  isLongAddress: boolean;
  road?: string;
  number?: string;
  mfg?: string;
  model?: string;
  comment?: string;
  maxSpeed?: number;
  imageFilePath?: string;
  iconFilePath?: string;
  functionKeys?: { [key: string]: string };
}

/**
 * Roster data structure
 */
export interface RosterData {
  [key: string]: RosterEntry;
}

/**
 * Roster message
 */
export interface RosterMessage extends JmriMessage {
  type: 'roster';
  method: 'list';
  data?: RosterData;
}

/**
 * Ping message (heartbeat)
 */
export interface PingMessage extends JmriMessage {
  type: 'ping';
}

/**
 * Pong message (heartbeat response)
 */
export interface PongMessage extends JmriMessage {
  type: 'pong';
}

/**
 * Hello message (connection establishment)
 */
export interface HelloMessage extends JmriMessage {
  type: 'hello';
  data?: {
    JMRI?: string;
    JSON?: string;
    Railroad?: string;
    node?: string;
    activeProfile?: string;
  };
}

/**
 * Goodbye message (graceful disconnect)
 */
export interface GoodbyeMessage extends JmriMessage {
  type: 'goodbye';
}

/**
 * Error message from JMRI
 */
export interface ErrorMessage extends JmriMessage {
  type: 'error';
  data: {
    code: number;
    message: string;
  };
}

/**
 * Union type of all possible JMRI messages
 */
export type AnyJmriMessage =
  | PowerMessage
  | ThrottleMessage
  | RosterMessage
  | PingMessage
  | PongMessage
  | HelloMessage
  | GoodbyeMessage
  | ErrorMessage;
