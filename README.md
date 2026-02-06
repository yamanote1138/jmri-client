# jmri-client

[![Build](https://github.com/yamanote1138/jmri-client/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/yamanote1138/jmri-client/actions/workflows/build-and-test.yml)
![License](https://img.shields.io/npm/l/jmri-client)
![NPM Version](https://img.shields.io/npm/v/jmri-client)

WebSocket client for [JMRI](http://jmri.sourceforge.net/) with real-time updates and full throttle control. This allows control of a model railroad layout via DCC with an event-driven interface.

[![NPM](https://nodei.co/npm/jmri-client.png?compact=true)](https://nodei.co/npm/jmri-client/)

## Features

- ✅ **WebSocket-based** - Real-time bidirectional communication
- ✅ **Event-driven** - Subscribe to power changes, throttle updates, and more
- ✅ **Full Throttle Control** - Speed (0.0-1.0), direction, and functions (F0-F28)
- ✅ **Auto-reconnection** - Exponential backoff with jitter
- ✅ **Heartbeat monitoring** - Automatic ping/pong keepalive
- ✅ **TypeScript** - Full type definitions included
- ✅ **Dual module support** - ESM and CommonJS

## Installation

```bash
npm install jmri-client
```

**Requirements:** Node.js 18+

## Quick Start

```typescript
import { JmriClient, PowerState } from 'jmri-client';

// Create client
const client = new JmriClient({
  host: 'jmri.local',
  port: 12080
});

// Listen for events
client.on('connected', () => console.log('Connected!'));
client.on('power:changed', (state) => {
  console.log('Power:', state === PowerState.ON ? 'ON' : 'OFF');
});

// Control power
await client.powerOn();

// Acquire and control a throttle
const throttleId = await client.acquireThrottle({ address: 3 });
await client.setThrottleSpeed(throttleId, 0.5);  // 50% speed
await client.setThrottleDirection(throttleId, true);  // Forward
await client.setThrottleFunction(throttleId, 'F0', true);  // Headlight on

// Clean up
await client.releaseThrottle(throttleId);
await client.disconnect();
```

## Migration from v2.x

### Breaking Changes

**v2.x (HTTP/axios):**
```javascript
const client = new JmriClient('http', 'jmri.local', 12080);
const response = await client.getPower();
console.log(response.data);  // axios response object
```

**v3.x (WebSocket):**
```typescript
const client = new JmriClient({ host: 'jmri.local', port: 12080 });
const powerState = await client.getPower();
console.log(powerState);  // Direct value (2 or 4)
```

### Key Differences

1. **Constructor** - Now takes options object instead of positional arguments
2. **Return values** - Methods return data directly, not axios response objects
3. **No protocol parameter** - v3.x always uses WebSocket
4. **Event-driven** - Subscribe to real-time updates via event emitters
5. **Throttle control** - Now fully implemented (was commented out in v2.x)

## API Reference

### Client Configuration

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

### Events

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

### Power Control

```typescript
// Get current power state
const state: PowerState = await client.getPower();
// PowerState.ON = 2, PowerState.OFF = 4

// Set power
await client.setPower(PowerState.ON);
await client.powerOn();   // Convenience method
await client.powerOff();  // Convenience method
```

### Roster Management

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

### Throttle Control

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

### Connection Management

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

## Examples

### Basic Power Control

```typescript
import { JmriClient, PowerState } from 'jmri-client';

const client = new JmriClient({ host: 'jmri.local' });

client.on('connected', async () => {
  const power = await client.getPower();
  console.log('Current power:', power === PowerState.ON ? 'ON' : 'OFF');

  await client.powerOn();
  console.log('Power turned ON');
});
```

### Running a Locomotive

```typescript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({ host: 'jmri.local' });

client.on('connected', async () => {
  // Ensure power is on
  await client.powerOn();

  // Acquire throttle for address 3
  const throttle = await client.acquireThrottle({ address: 3 });

  // Start moving forward slowly
  await client.setThrottleDirection(throttle, true);
  await client.setThrottleFunction(throttle, 'F0', true);  // Headlight
  await client.setThrottleSpeed(throttle, 0.25);

  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Speed up
  await client.setThrottleSpeed(throttle, 0.5);

  // Wait 5 more seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Stop
  await client.setThrottleSpeed(throttle, 0);
  await client.setThrottleFunction(throttle, 'F0', false);

  // Release throttle
  await client.releaseThrottle(throttle);
  await client.disconnect();
});
```

### Monitoring Real-Time Updates

```typescript
import { JmriClient, PowerState } from 'jmri-client';

const client = new JmriClient({ host: 'jmri.local' });

// Log all connection events
client.on('connected', () => console.log('✓ Connected'));
client.on('disconnected', (reason) => console.log('✗ Disconnected:', reason));
client.on('reconnecting', (attempt, delay) => {
  console.log(`Reconnecting (attempt ${attempt}) in ${delay}ms...`);
});
client.on('reconnected', () => console.log('✓ Reconnected!'));

// Monitor power changes
client.on('power:changed', (state) => {
  console.log('Power changed:', state === PowerState.ON ? 'ON' : 'OFF');
});

// Monitor throttle updates
client.on('throttle:updated', (id, data) => {
  console.log(`Throttle ${id} updated:`, data);
});
```

## Testing

Run the functional tests with a live JMRI instance:

```bash
# Build the project
npm run build

# Basic demo (power and roster)
npm run functional

# Throttle control demo
npm run functional:throttle
```

The functional tests will prompt for JMRI server details.

## Troubleshooting

### Connection Issues

1. **Ensure JMRI Web Server is running:**
   - In JMRI: Tools → Start JMRI Web Server
   - Default port is 12080

2. **Check firewall settings:**
   - Allow incoming connections on port 12080

3. **Enable debug logging:**
   ```typescript
   client.on('error', (error) => console.error('Error:', error));
   client.on('message:sent', (msg) => console.log('Sent:', msg));
   client.on('message:received', (msg) => console.log('Received:', msg));
   ```

### Throttle Issues

1. **Throttle not responding:**
   - Ensure track power is ON
   - Verify DCC address is correct
   - Check that locomotive is on the track

2. **Throttle lost on reconnect:**
   - JMRI releases throttles on disconnect
   - Listen for `throttle:lost` events to handle this

## License

MIT

## Links

- [GitHub Repository](https://github.com/yamanote1138/jmri-client)
- [NPM Package](https://www.npmjs.com/package/jmri-client)
- [JMRI Project](http://jmri.sourceforge.net/)
- [JMRI JSON Protocol Docs](https://www.jmri.org/help/en/html/web/JsonServlet.shtml)

## Contributing

Issues and pull requests welcome! Please see the GitHub repository.
