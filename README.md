# jmri-client

[![Build](https://github.com/yamanote1138/jmri-client/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/yamanote1138/jmri-client/actions/workflows/build-and-test.yml)
![License](https://img.shields.io/npm/l/jmri-client)
![NPM Version](https://img.shields.io/npm/v/jmri-client)

WebSocket client for [JMRI](http://jmri.sourceforge.net/) with real-time updates and full throttle control.

[![NPM](https://nodei.co/npm/jmri-client.png?compact=true)](https://nodei.co/npm/jmri-client/)

## Features

- ✅ **WebSocket-based** - Real-time bidirectional communication
- ✅ **Event-driven** - Subscribe to power changes, throttle updates, and more
- ✅ **Full Throttle Control** - Speed (0.0-1.0), direction, and functions (F0-F28)
- ✅ **Browser & Node.js** - Works in browsers and Node.js with auto-detection
- ✅ **Mock Mode** - Test and demo without JMRI hardware
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
  const stateStr = state === PowerState.ON ? 'ON' :
                   state === PowerState.OFF ? 'OFF' : 'UNKNOWN';
  console.log('Power:', stateStr);
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

## Documentation

- **[API Reference](docs/API.md)** - Complete API documentation
- **[Browser Usage](docs/BROWSER.md)** - Using jmri-client in web browsers
- **[Examples](docs/EXAMPLES.md)** - Common usage patterns
- **[Mock Mode](docs/MOCK_MODE.md)** - Testing without hardware
- **[Migration Guide](docs/MIGRATION.md)** - Upgrading from v2.x
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Key Concepts

### Event-Driven Architecture

Subscribe to real-time updates from JMRI:

```typescript
client.on('connected', () => { });
client.on('disconnected', (reason) => { });
client.on('power:changed', (state) => { });
client.on('throttle:updated', (id, data) => { });
```

### Throttle Control

Full control of DCC locomotives:

```typescript
const throttle = await client.acquireThrottle({ address: 3 });
await client.setThrottleSpeed(throttle, 0.5);
await client.setThrottleDirection(throttle, true);
await client.setThrottleFunction(throttle, 'F0', true);
await client.releaseThrottle(throttle);
```

### Auto-Reconnection

Automatically reconnects with exponential backoff:

```typescript
client.on('reconnecting', (attempt, delay) => {
  console.log(`Reconnecting attempt ${attempt} in ${delay}ms`);
});
```

## Testing

**Unit Tests** (no hardware required):
```bash
npm test
```

**Mock Mode Demo** (no hardware required):
```bash
npm run demo:mock
```

**Functional Test** (requires JMRI hardware):
```bash
npm run functional
```

⚠️ **Safety**: Includes automatic power-off on exit, errors, and Ctrl+C.

See **[Mock Mode Guide](docs/MOCK_MODE.md)** and **[Testing Guide](docs/TESTING.md)** for complete instructions.

## Contributing

Issues and pull requests welcome! Please see the [GitHub repository](https://github.com/yamanote1138/jmri-client).

## License

MIT

## Links

- [GitHub Repository](https://github.com/yamanote1138/jmri-client)
- [NPM Package](https://www.npmjs.com/package/jmri-client)
- [JMRI Project](http://jmri.sourceforge.net/)
- [JMRI JSON Protocol](https://www.jmri.org/help/en/html/web/JsonServlet.shtml)
