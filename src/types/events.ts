/**
 * Event types for JmriClient EventEmitter
 */

import { PowerState, TurnoutState } from './jmri-messages.js';
import { ThrottleData } from './jmri-messages.js';

/**
 * Connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

/**
 * Event payload types
 */
export interface EventPayloads {
  // Connection events
  'connected': void;
  'disconnected': string; // reason
  'reconnecting': [attempt: number, delay: number];
  'reconnected': void;
  'connectionStateChanged': ConnectionState;
  'error': Error;

  // Power events
  'power:changed': PowerState;

  // Turnout events
  'turnout:changed': [name: string, state: TurnoutState];

  // Throttle events
  'throttle:acquired': string; // throttle ID
  'throttle:updated': [throttleId: string, data: ThrottleData];
  'throttle:released': string; // throttle ID
  'throttle:lost': string; // throttle ID (server removed it)

  // Heartbeat events
  'heartbeat:sent': void;
  'heartbeat:timeout': void;

  // Message events
  'message:sent': any;
  'message:received': any;
}

/**
 * Event listener type
 */
export type EventListener<T> = (payload: T) => void;

/**
 * Event map for type-safe event emitter
 */
export type EventMap = {
  [K in keyof EventPayloads]: EventPayloads[K] extends void
    ? () => void
    : EventPayloads[K] extends [infer A, infer B]
    ? (arg1: A, arg2: B) => void
    : (payload: EventPayloads[K]) => void;
};
