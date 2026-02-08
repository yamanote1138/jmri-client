# API Reference

## Client Configuration

```typescript
const client = new JmriClient({
  host: 'localhost',              // JMRI server hostname
  port: 12080,                    // WebSocket port (default JMRI port)
  protocol: 'ws',                 // 'ws' or 'wss' for secure
  autoConnect: true,              // Connect automatically on instantiation

  reconnection: {
    enabled: true,                // Auto-reconnect on disconnect
    maxAttempts: 0,              // 0 = infinite attempts
    initialDelay: 1000,          // Start with 1 second delay
    maxDelay: 30000,             // Cap at 30 seconds
    multiplier: 1.5,             // Exponential backoff multiplier
    jitter: true                 // Add ±25% jitter to delays
  },

  heartbeat: {
    enabled: true,               // Send ping/pong keepalive
    interval: 30000,             // Ping every 30 seconds
    timeout: 5000                // Expect pong within 5 seconds
  },

  messageQueueSize: 100,         // Queue messages when disconnected
  requestTimeout: 10000          // Request timeout in milliseconds
});
```

## Events

```typescript
// Connection events
client.on('connected', () => { });
client.on('disconnected', (reason: string) => { });
client.on('reconnecting', (attempt: number, delay: number) => { });
client.on('reconnected', () => { });
client.on('error', (error: Error) => { });

// Power events
client.on('power:changed', (state: PowerState) => { });

// Throttle events
client.on('throttle:acquired', (throttleId: string) => { });
client.on('throttle:updated', (throttleId: string, data: any) => { });
client.on('throttle:released', (throttleId: string) => { });
client.on('throttle:lost', (throttleId: string) => { });

// Heartbeat events
client.on('heartbeat:sent', () => { });
client.on('heartbeat:timeout', () => { });
```

## Power Control

```typescript
// Get current power state
const state: PowerState = await client.getPower();

// PowerState enum values (from JMRI JSON protocol):
// PowerState.UNKNOWN = 0  (state cannot be determined)
// PowerState.ON = 2       (power is on)
// PowerState.OFF = 4      (power is off)

// Handle power state
switch (state) {
  case PowerState.ON:
    console.log('Power is ON');
    break;
  case PowerState.OFF:
    console.log('Power is OFF');
    break;
  case PowerState.UNKNOWN:
    console.log('Power state is UNKNOWN');
    break;
}

// Set power
await client.setPower(PowerState.ON);
await client.powerOn();   // Convenience method
await client.powerOff();  // Convenience method

// Listen for power changes (including UNKNOWN states)
client.on('power:changed', (state: PowerState) => {
  if (state === PowerState.UNKNOWN) {
    console.log('Power state became unknown (connection issue?)');
  }
});
```

## Roster Management

```typescript
// Get all roster entries
const roster: RosterEntry[] = await client.getRoster();

// Find by name
const entry = await client.getRosterEntryByName('Big Boy');

// Find by address
const entry = await client.getRosterEntryByAddress(3);

// Search roster
const results = await client.searchRoster('steam');
```

## Throttle Control

```typescript
// Acquire throttle
const throttleId = await client.acquireThrottle({ address: 3 });

// Control speed (0.0 to 1.0)
await client.setThrottleSpeed(throttleId, 0.0);   // Stopped
await client.setThrottleSpeed(throttleId, 0.5);   // Half speed
await client.setThrottleSpeed(throttleId, 1.0);   // Full speed

// Control direction
await client.setThrottleDirection(throttleId, true);   // Forward
await client.setThrottleDirection(throttleId, false);  // Reverse

// Control functions (F0-F28)
await client.setThrottleFunction(throttleId, 'F0', true);   // Headlight on
await client.setThrottleFunction(throttleId, 'F1', true);   // Bell on
await client.setThrottleFunction(throttleId, 'F2', true);   // Horn/whistle

// Emergency stop
await client.emergencyStop(throttleId);  // Immediate stop

// Idle (stop but maintain direction)
await client.idleThrottle(throttleId);

// Get throttle state
const state = client.getThrottleState(throttleId);
console.log(state.speed, state.forward, state.functions);

// Release throttle
await client.releaseThrottle(throttleId);

// Release all throttles
await client.releaseAllThrottles();
```

## Connection Management

```typescript
// Connect manually (if autoConnect: false)
await client.connect();

// Disconnect gracefully
await client.disconnect();

// Check connection state
if (client.isConnected()) {
  // Do something
}

// Get detailed state
const state = client.getConnectionState();
// ConnectionState.CONNECTED, DISCONNECTED, CONNECTING, or RECONNECTING
```

## Utility Functions

```typescript
import { powerStateToString, isThrottleFunctionKey, isValidSpeed } from 'jmri-client';

// Convert PowerState enum to readable string
const stateStr = powerStateToString(PowerState.ON);  // 'ON'
const stateStr2 = powerStateToString(PowerState.UNKNOWN);  // 'UNKNOWN'

// Validate throttle function key
isThrottleFunctionKey('F0');  // true
isThrottleFunctionKey('F99');  // false

// Validate speed value (0.0 to 1.0)
isValidSpeed(0.5);  // true
isValidSpeed(1.5);  // false
```

## TypeScript Types

All types are exported from the main package:

```typescript
import {
  JmriClient,
  JmriClientOptions,
  PowerState,
  RosterEntry,
  ThrottleState,
  ThrottleFunctionKey,
  ConnectionState
} from 'jmri-client';
```
