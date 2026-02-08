# Migration Guide: v2.x to v3.x

## Overview

Version 3.0 is a complete rewrite switching from HTTP/axios to WebSocket-based communication. This enables real-time updates and full throttle control.

## Breaking Changes

### 1. Constructor API

**v2.x:**
```javascript
const client = new JmriClient('http', 'jmri.local', 12080);
```

**v3.x:**
```typescript
const client = new JmriClient({
  host: 'jmri.local',
  port: 12080
});
```

**Changes:**
- Constructor now takes an options object
- No `protocol` parameter (always uses WebSocket)
- Added `autoConnect` option (default: true)
- Added reconnection and heartbeat configuration

### 2. Return Values

**v2.x:**
```javascript
const response = await client.getPower();
console.log(response.data);  // axios response object
```

**v3.x:**
```typescript
const powerState = await client.getPower();
console.log(powerState);  // Direct value (PowerState enum)
```

**Changes:**
- Methods return data directly instead of axios response objects
- No more `.data` property on responses
- Power state is now a `PowerState` enum (UNKNOWN=0, ON=2, OFF=4)

### 3. Power Control

**v2.x:**
```javascript
await client.setPower(true);   // boolean
await client.setPower(false);
```

**v3.x:**
```typescript
await client.setPower(PowerState.ON);   // enum
await client.setPower(PowerState.OFF);

// Or use convenience methods:
await client.powerOn();
await client.powerOff();
```

### 4. Event-Driven Architecture (NEW)

v3.x introduces an event-driven pattern for real-time updates:

```typescript
client.on('connected', () => console.log('Connected!'));
client.on('disconnected', (reason) => console.log('Disconnected:', reason));
client.on('power:changed', (state) => console.log('Power:', state));
client.on('throttle:updated', (id, data) => console.log('Throttle:', id));
```

### 5. Throttle Control (NEW)

v2.x had commented-out throttle methods. v3.x has full throttle support:

```typescript
// Acquire throttle
const throttleId = await client.acquireThrottle({ address: 3 });

// Control speed (0.0 to 1.0)
await client.setThrottleSpeed(throttleId, 0.5);

// Control direction
await client.setThrottleDirection(throttleId, true);  // forward

// Control functions F0-F28
await client.setThrottleFunction(throttleId, 'F0', true);

// Release when done
await client.releaseThrottle(throttleId);
```

### 6. Node.js Version

**v2.x:** Node.js 14+
**v3.x:** Node.js 18+

### 7. Dependencies Removed

- `axios` - Replaced with native WebSocket
- `xml2json` - No longer needed (JSON protocol only)

## New Features

### Auto-Reconnection

```typescript
const client = new JmriClient({
  host: 'jmri.local',
  reconnection: {
    enabled: true,
    maxAttempts: 0,        // infinite
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 1.5,
    jitter: true
  }
});

client.on('reconnecting', (attempt, delay) => {
  console.log(`Reconnecting attempt ${attempt} in ${delay}ms`);
});
```

### Heartbeat Monitoring

```typescript
const client = new JmriClient({
  host: 'jmri.local',
  heartbeat: {
    enabled: true,
    interval: 30000,
    timeout: 5000
  }
});
```

### Message Queuing

Messages sent while disconnected are queued and automatically flushed when reconnected.

## Migration Steps

### Step 1: Update Node.js

Ensure you're running Node.js 18 or higher:

```bash
node --version  # Should be >= 18.0.0
```

### Step 2: Update Package

```bash
npm install jmri-client@3.0.0
```

### Step 3: Update Import

If using TypeScript, import types:

```typescript
import { JmriClient, PowerState } from 'jmri-client';
```

### Step 4: Update Constructor

Replace positional arguments with options object:

```typescript
// Before
const client = new JmriClient('http', 'jmri.local', 12080);

// After
const client = new JmriClient({
  host: 'jmri.local',
  port: 12080
});
```

### Step 5: Update Power Control

Replace boolean with enum:

```typescript
// Before
await client.setPower(true);

// After
await client.powerOn();
// or
await client.setPower(PowerState.ON);
```

### Step 6: Handle Response Values

Remove `.data` access:

```typescript
// Before
const response = await client.getPower();
const state = response.data.state;

// After
const state = await client.getPower();
```

### Step 7: Add Event Listeners (Optional)

Take advantage of real-time updates:

```typescript
client.on('connected', () => {
  console.log('Connected to JMRI');
});

client.on('power:changed', (state) => {
  const stateStr = state === PowerState.ON ? 'ON' :
                   state === PowerState.OFF ? 'OFF' : 'UNKNOWN';
  console.log('Power changed:', stateStr);
});
```

## Complete Example

**Before (v2.x):**
```javascript
const { JmriClient } = require('jmri-client');

const client = new JmriClient('http', 'jmri.local', 12080);

async function main() {
  const powerResponse = await client.getPower();
  console.log(powerResponse.data);

  await client.setPower(true);
  console.log('Power turned on');
}

main();
```

**After (v3.x):**
```typescript
import { JmriClient, PowerState } from 'jmri-client';

const client = new JmriClient({
  host: 'jmri.local',
  port: 12080
});

client.on('connected', async () => {
  const powerState = await client.getPower();
  console.log('Current power:', powerState);

  await client.powerOn();
  console.log('Power turned on');
});

client.on('error', (error) => {
  console.error('Error:', error);
});
```

## Getting Help

- [Full API Reference](./API.md)
- [Examples](./EXAMPLES.md)
- [GitHub Issues](https://github.com/yamanote1138/jmri-client/issues)
