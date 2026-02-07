# Mock Mode

Mock mode allows you to test and demo the JMRI client without requiring a real JMRI server or hardware. All responses are generated from mock data, making it perfect for:

- **Unit testing** - Consistent, predictable responses
- **Demos** - No hardware setup required
- **Development** - Test without running JMRI
- **CI/CD** - Automated testing without external dependencies

## Quick Start

Enable mock mode by passing `mock: { enabled: true }` in the client options:

```javascript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({
  mock: {
    enabled: true,        // Enable mock mode
    responseDelay: 50     // Optional: simulate network latency (ms)
  }
});

await client.connect();

// All methods work as normal, but with mock responses
const roster = await client.getRoster();
console.log(roster); // Returns mock roster data
```

## Configuration Options

### `mock.enabled`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable or disable mock mode

### `mock.responseDelay`
- **Type:** `number` (milliseconds)
- **Default:** `50`
- **Description:** Simulated network latency. Set to `0` for instant responses.

## Mock Data

All mock responses are defined in `src/mocks/mock-data.ts`. The mock data includes:

### Hello Response
Connection establishment response with JMRI version info:
```json
{
  "type": "hello",
  "data": {
    "JMRI": "5.9.2",
    "JSON": "5.0",
    "Railroad": "Demo Railroad"
  }
}
```

### Power Responses
Track power ON/OFF states

### Roster
Three sample locomotives:
- **CSX754** - GP38-2 diesel locomotive
- **UP3985** - Challenger 4-6-6-4 steam locomotive
- **BNSF5240** - SD40-2 diesel locomotive

Each includes realistic function key mappings (F0-F4).

### Throttle Responses
Supports all throttle operations:
- Acquire/release
- Speed control (0.0 - 1.0)
- Direction (forward/reverse)
- Function keys (F0-F28)

### Heartbeat
Responds to ping messages with pong

## Example: Complete Demo

See `examples/mock-demo.mjs` for a complete working example.

```javascript
import { JmriClient } from 'jmri-client';

async function demo() {
  // Create client with mock mode
  const client = new JmriClient({
    mock: { enabled: true, responseDelay: 100 },
    autoConnect: true
  });

  // Wait for connection
  await new Promise((resolve) => client.on('connected', resolve));

  // Get roster
  const roster = await client.getRoster();
  console.log(`Found ${Object.keys(roster).length} locomotives`);

  // Turn power on
  await client.powerOn();
  const power = await client.getPower();
  console.log(`Power: ${power === 2 ? 'ON' : 'OFF'}`);

  // Acquire throttle
  const throttleId = await client.acquireThrottle({ address: 754 });

  // Control locomotive
  await client.setThrottleSpeed(throttleId, 0.5);
  await client.setThrottleDirection(throttleId, true);
  await client.setThrottleFunction(throttleId, 'F0', true);

  // Release throttle
  await client.releaseThrottle(throttleId);

  // Disconnect
  await client.disconnect();
}
```

Run the demo:
```bash
npm run demo:mock
```

## Using Mock Data in Tests

The mock data is shared between the mock system and unit tests, ensuring consistency.

```typescript
import { mockData, MockResponseManager } from 'jmri-client';

// Access mock data directly
const rosterData = mockData.roster.list.data;

// Or use the response manager
const mockManager = new MockResponseManager();
const response = await mockManager.getMockResponse({
  type: 'roster',
  method: 'list'
});
```

## Stateful Behavior

The mock system maintains state for realistic behavior:

- **Power state** - Remembers if power is ON or OFF
- **Throttles** - Tracks acquired throttles and their states
- **Speed/Direction** - Maintains current speed and direction per throttle
- **Functions** - Tracks function key states (F0-F28)

State is maintained within each `MockResponseManager` instance.

## Testing with Mock Mode

To run unit tests that use mock mode:

```bash
npm test
```

All unit tests run in-memory without requiring WebSocket connections or JMRI servers.

## Customizing Mock Data

To customize mock responses:

1. Edit `src/mocks/mock-data.ts`
2. Rebuild: `npm run build`
3. Test your changes: `npm run demo:mock`

The mock data structure follows the JMRI JSON protocol specification.

## Comparison: Mock Mode vs Real Mode

| Feature | Mock Mode | Real Mode |
|---------|-----------|-----------|
| JMRI server required | ❌ No | ✅ Yes |
| Hardware required | ❌ No | ✅ Yes |
| Network latency | Simulated | Real |
| Consistent responses | ✅ Yes | Varies |
| State persistence | In-memory | JMRI server |
| Best for | Testing, demos, CI/CD | Production use |

## API Compatibility

Mock mode implements the full JMRI client API. All methods work identically:

- ✅ `connect()` / `disconnect()`
- ✅ `getPower()` / `powerOn()` / `powerOff()`
- ✅ `getRoster()`
- ✅ `acquireThrottle()` / `releaseThrottle()`
- ✅ `setThrottleSpeed()`
- ✅ `setThrottleDirection()`
- ✅ `setThrottleFunction()`
- ✅ All event emitters

## Limitations

Mock mode is designed for testing and demonstration. Be aware:

- No real locomotives are controlled
- State is not persisted between client instances
- No actual JMRI server validation
- Simulated latency only (no real network variability)
- Limited error scenarios in mock data

For production use with real hardware, disable mock mode (default).
