/**
 * jmri-client v3.0
 * WebSocket client for JMRI with real-time updates and throttle control
 */

export { JmriClient } from './client';

// Export types
export {
  // Core types
  JmriClientOptions,
  PartialClientOptions,
  ReconnectionOptions,
  HeartbeatOptions,

  // JMRI message types
  PowerState,
  RosterEntry,
  JmriMessage,
  PowerMessage,
  ThrottleMessage,
  RosterMessage,

  // Event types
  ConnectionState,
  EventPayloads,

  // Throttle types
  ThrottleAcquireOptions,
  ThrottleFunctionKey,
  ThrottleState
} from './types';

// Export utility functions if needed
export { isThrottleFunctionKey, isValidSpeed } from './types/throttle';
