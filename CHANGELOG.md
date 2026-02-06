# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-02-05

### Major Rewrite - WebSocket Architecture

This is a complete rewrite of jmri-client, migrating from HTTP/axios to WebSocket-based communication. This enables real-time updates and full throttle control.

### Breaking Changes

#### Constructor Changes
**v2.x:**
```javascript
const client = new JmriClient('http', 'jmri.local', 12080);
```

**v3.x:**
```typescript
const client = new JmriClient({ host: 'jmri.local', port: 12080 });
```

- Constructor now takes options object instead of positional arguments
- No `protocol` parameter (always uses WebSocket)
- `autoConnect` option added (default: true)

#### Return Value Changes
**v2.x:**
```javascript
const response = await client.getPower();
console.log(response.data); // axios response object
```

**v3.x:**
```typescript
const powerState = await client.getPower();
console.log(powerState); // Direct value (PowerState enum)
```

- Methods now return data directly instead of axios response objects
- No more `.data` property on responses

#### Removed Dependencies
- `axios` - Replaced with native WebSocket
- `xml2json` - No longer needed (using JSON protocol)

### Added

#### Core Features
- **WebSocket Communication** - Real-time bidirectional communication with JMRI
- **Event-Driven Architecture** - Subscribe to events for power changes, throttle updates, etc.
- **Auto-Reconnection** - Exponential backoff with jitter (1s to 30s)
- **Heartbeat Monitoring** - Automatic ping/pong keepalive
- **Message Queuing** - Queue messages when disconnected, flush on reconnect
- **TypeScript** - Full TypeScript rewrite with complete type definitions
- **Dual Module Support** - Both ESM and CommonJS builds

#### Throttle Control (NEW)
- `acquireThrottle(options)` - Acquire throttle by DCC address
- `releaseThrottle(throttleId)` - Release throttle
- `setThrottleSpeed(throttleId, speed)` - Control speed (0.0 to 1.0)
- `setThrottleDirection(throttleId, forward)` - Control direction
- `setThrottleFunction(throttleId, functionKey, value)` - Control functions F0-F28
- `emergencyStop(throttleId)` - Emergency stop
- `idleThrottle(throttleId)` - Set to idle
- `getThrottleState(throttleId)` - Get current throttle state
- `getAllThrottles()` - Get all active throttles
- `releaseAllThrottles()` - Release all throttles

#### Power Control (Enhanced)
- `getPower()` - Returns PowerState enum directly
- `setPower(state)` - Set power using PowerState enum
- `powerOn()` - Convenience method to turn power on
- `powerOff()` - Convenience method to turn power off

#### Roster Management (Enhanced)
- `getRoster()` - Get all roster entries
- `getRosterEntryByName(name)` - Find entry by name
- `getRosterEntryByAddress(address)` - Find entry by address
- `searchRoster(query)` - Search roster with partial match

#### Events
- Connection events: `connected`, `disconnected`, `reconnecting`, `reconnected`, `error`
- Power events: `power:changed`
- Throttle events: `throttle:acquired`, `throttle:updated`, `throttle:released`, `throttle:lost`
- Heartbeat events: `heartbeat:sent`, `heartbeat:timeout`
- State events: `connectionStateChanged`

#### Configuration Options
- `host` - JMRI server hostname
- `port` - WebSocket port (default: 12080)
- `protocol` - 'ws' or 'wss' (default: 'ws')
- `autoConnect` - Auto-connect on instantiation (default: true)
- `reconnection` - Reconnection strategy options
  - `enabled` - Enable auto-reconnection (default: true)
  - `maxAttempts` - Max attempts (0 = infinite, default: 0)
  - `initialDelay` - Initial delay in ms (default: 1000)
  - `maxDelay` - Max delay in ms (default: 30000)
  - `multiplier` - Backoff multiplier (default: 1.5)
  - `jitter` - Add jitter to delays (default: true)
- `heartbeat` - Heartbeat options
  - `enabled` - Enable heartbeat (default: true)
  - `interval` - Ping interval in ms (default: 30000)
  - `timeout` - Pong timeout in ms (default: 5000)
- `messageQueueSize` - Max queued messages (default: 100)
- `requestTimeout` - Request timeout in ms (default: 10000)

#### Type Exports
- `JmriClient` - Main client class
- `JmriClientOptions`, `PartialClientOptions` - Configuration types
- `PowerState` - Power state enum (ON=2, OFF=4)
- `RosterEntry` - Roster entry type
- `ThrottleState` - Throttle state type
- `ThrottleFunctionKey` - Function key type (F0-F28)
- `ConnectionState` - Connection state enum
- And many more...

### Changed

#### Node.js Version
- **Minimum Node.js version is now 18** (was 14)
- Uses modern Node.js features and latest TypeScript 5.x

#### Build System
- TypeScript 5.3.3 (was 4.8.3)
- Dual builds: CommonJS (`dist/cjs/`) and ESM (`dist/esm/`)
- Type definitions in `dist/types/`

#### Module Structure
- Organized into logical modules:
  - `src/core/` - Core WebSocket infrastructure
  - `src/managers/` - Feature managers (power, roster, throttle)
  - `src/types/` - TypeScript type definitions
  - `src/utils/` - Utility functions

### Removed

- `axios` dependency
- `xml2json` dependency
- HTTP/XML protocol support
- Commented-out throttle methods (now implemented)

### Migration Guide

See README.md for detailed migration instructions from v2.x to v3.x.

#### Quick Migration Example

**Before (v2.x):**
```javascript
import { JmriClient } from 'jmri-client';

const client = new JmriClient('http', 'jmri.local', 12080);

const power = await client.getPower();
console.log(power.data); // { state: 2 }

await client.setPower(true);
```

**After (v3.x):**
```typescript
import { JmriClient, PowerState } from 'jmri-client';

const client = new JmriClient({
  host: 'jmri.local',
  port: 12080
});

client.on('connected', async () => {
  const power = await client.getPower();
  console.log(power); // PowerState.ON (2) or PowerState.OFF (4)

  await client.powerOn();
});
```

---

## [2.2.0] - Previous Version

### Changed
- Updated dependencies
- Bug fixes and improvements

## [2.1.0] and Earlier

See git history for previous changes.

---

[3.0.0]: https://github.com/yamanote1138/jmri-client/compare/v2.2.0...v3.0.0
