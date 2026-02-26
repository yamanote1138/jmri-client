/**
 * jmri-client v3.0
 * WebSocket client for JMRI with real-time updates and throttle control
 */

export { JmriClient } from './client.js';

// Export types
export {
  // Core types
  JmriClientOptions,
  PartialClientOptions,
  ReconnectionOptions,
  HeartbeatOptions,
  MockOptions,

  // JMRI message types
  PowerState,
  TurnoutState,
  RosterEntry,
  TurnoutData,
  JmriMessage,
  PowerMessage,
  TurnoutMessage,
  ThrottleMessage,
  RosterMessage,

  // Event types
  ConnectionState,
  EventPayloads,

  // Throttle types
  ThrottleAcquireOptions,
  ThrottleFunctionKey,
  ThrottleState
} from './types/index.js';

// Export utility functions
export { isThrottleFunctionKey, isValidSpeed } from './types/throttle.js';
export { powerStateToString, turnoutStateToString } from './types/jmri-messages.js';

// Export mock system for testing and demo purposes
export { MockResponseManager, mockResponseManager, mockData } from './mocks/index.js';
export type { MockResponseManagerOptions } from './mocks/index.js';
