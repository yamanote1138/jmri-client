# Mock Mode

Mock mode allows you to test and demo the JMRI client without requiring a real JMRI server or hardware. All responses are generated from configurable mock data, making it perfect for:

- **Unit testing** — Consistent, predictable responses
- **Demos** — No hardware setup required
- **Development** — Test without running JMRI
- **CI/CD** — Automated testing without external dependencies

## Quick Start

Enable mock mode by passing `mock: { enabled: true }` in the client options:

```javascript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({
  mock: { enabled: true }
});

await client.connect();

// All methods work as normal, but with mock responses
const roster = await client.getRoster();
console.log(roster); // Returns mock roster data
```

This uses the built-in default layout: three locomotives, three lights, three turnouts. All configurable.

## Configuration Options

### `mock.enabled`
- **Type:** `boolean`
- **Default:** `false`
- Enable or disable mock mode.

### `mock.responseDelay`
- **Type:** `number` (milliseconds)
- **Default:** `50`
- Simulated network latency. Set to `0` for instant responses. Overridden by `config.timing.responseDelay` if set.

### `mock.configPath` *(Node.js only)*
- **Type:** `string`
- Path to a YAML configuration file. Defines the server identity, roster, lights, turnouts, and timing. See the [YAML Config](#yaml-config) section below.

### `mock.config`
- **Type:** `MockConfig` object
- Inline configuration. Works in any environment (Node.js and browsers). Merged over `DEFAULT_MOCK_CONFIG` — arrays replace entirely, scalar/object fields deep-merge.

## How It Works

When `connect()` is called in mock mode:

1. **Config is loaded** — from the YAML file, inline object, or built-in defaults
2. **`MockResponseManager` is created** — initialized with the loaded config; builds in-memory state for lights, turnouts, and power
3. **Connection is simulated** — after a configurable delay (`timing.connectionDelay`), the client transitions to CONNECTED
4. **Hello handshake fires** — a synthetic hello message is routed through the normal message pipeline so `JmriClient` emits the `connected` event with server info from the config

From that point, every `request()` call bypasses the WebSocket entirely and routes to `MockResponseManager.getMockResponse()`. The response is piped through the same `processMessage()` path as real WebSocket messages, so all event emitters behave identically to real mode.

**State is maintained in memory.** Turning a light on, throwing a turnout, acquiring a throttle — all persist within the `MockResponseManager` instance for the lifetime of the connection. `reset()` restores everything to config values.

## YAML Config

Copy `examples/mock-config.example.yaml` from the package, edit it to match your layout, and pass the path:

```javascript
const client = new JmriClient({
  mock: {
    enabled: true,
    configPath: './my-layout.yaml'
  }
});
```

### Full schema

```yaml
# Server identity — returned in the initial hello handshake
server:
  jmri: "5.9.2"
  json: "5.0"
  heartbeat: 13500
  railroad: "My Model Railroad"
  node: "jmri-server"
  activeProfile: "Main"

# Power state on startup: ON | OFF | UNKNOWN
power:
  initialState: OFF

# Locomotive roster
roster:
  - name: "CSX754"
    address: "754"
    isLongAddress: true
    road: "CSX"
    number: "754"
    mfg: "Athearn"
    decoderModel: "DH163D"
    decoderFamily: "Digitrax DH163"
    model: "GP38-2"
    comment: "Blue and yellow scheme"
    maxSpeedPct: 100
    functionKeys:
      - name: F0
        label: "Headlight"
        lockable: true
      - name: F2
        label: "Horn"
        lockable: false

# Lights — state: ON | OFF | UNKNOWN
lights:
  - name: IL1
    userName: "Yard Light"
    state: OFF
  - name: IL3
    userName: "Signal Lamp"
    state: ON

# Turnouts — state: CLOSED | THROWN | UNKNOWN
turnouts:
  - name: LT1
    userName: "Main Diverge"
    state: CLOSED
  - name: LT3
    userName: "Siding Entry"
    state: THROWN

# Timing
timing:
  responseDelay: 50    # ms — simulates JMRI server latency
  connectionDelay: 10  # ms — simulates TCP handshake
```

All fields are optional. Omitted fields fall back to `DEFAULT_MOCK_CONFIG` values.

**Note:** Arrays (`roster`, `lights`, `turnouts`) replace the defaults entirely — they are not merged. If you define two lights in your config, only those two lights exist in the mock.

## Inline Config

For environments where file I/O isn't available (browsers, tests), pass a config object directly:

```javascript
const client = new JmriClient({
  mock: {
    enabled: true,
    config: {
      server: { railroad: 'Test Layout' },
      lights: [
        { name: 'IL1', userName: 'Platform', state: 'ON' }
      ],
      roster: [
        { name: 'LOCO1', address: '1234', model: 'GP9' }
      ]
    }
  }
});
```

## Default Layout

When no config is provided, the mock uses `DEFAULT_MOCK_CONFIG`, which is exported for reference:

```javascript
import { DEFAULT_MOCK_CONFIG } from 'jmri-client';
```

**Roster:** CSX754 (GP38-2), UP3985 (Challenger 4-6-6-4), BNSF5240 (SD40-2)

**Lights:**
| Name | User Name | Initial State |
|------|-----------|---------------|
| IL1 | Yard Light | OFF |
| IL2 | Platform Light | OFF |
| IL3 | Signal Lamp | ON |

**Turnouts:**
| Name | User Name | Initial State |
|------|-----------|---------------|
| LT1 | Main Diverge | CLOSED |
| LT2 | Yard Lead | CLOSED |
| LT3 | Siding Entry | THROWN |

## Using MockResponseManager Directly

For unit tests that need direct access to the manager:

```typescript
import { MockResponseManager, DEFAULT_MOCK_CONFIG } from 'jmri-client';

// Default layout, zero delay
const manager = new MockResponseManager();

// Custom layout
const manager = new MockResponseManager({
  ...DEFAULT_MOCK_CONFIG,
  lights: [{ name: 'IL99', userName: 'Test Light', state: 'ON' }],
  timing: { responseDelay: 0 }
});

const response = await manager.getMockResponse({ type: 'roster', method: 'list' });

// Reset state back to config values
manager.reset();
```

A shared singleton with zero delay is also available:

```typescript
import { mockResponseManager } from 'jmri-client';
```

## Stateful Behavior

The mock system maintains state for realistic behavior:

- **Power** — Remembers ON/OFF state; persists across calls
- **Lights** — Tracks ON/OFF state per light; updated by `setLight()`
- **Turnouts** — Tracks CLOSED/THROWN per turnout; updated by `setTurnout()`
- **Throttles** — Tracks acquired throttles with speed, direction, and F0–F28 states
- **Reset** — `manager.reset()` restores everything to the values defined in the config

## Testing with Mock Mode

```bash
npm test
```

All unit tests run in-memory without WebSocket connections or a JMRI server.

## Comparison: Mock vs Real

| Feature | Mock Mode | Real Mode |
|---------|-----------|-----------|
| JMRI server required | No | Yes |
| Hardware required | No | Yes |
| Network latency | Simulated | Real |
| Consistent responses | Yes | Varies |
| State persistence | In-memory | JMRI server |
| Configurable layout | Yes (YAML or object) | JMRI config |
| Best for | Testing, demos, CI/CD | Production |

## API Compatibility

Mock mode implements the full JMRI client API. All methods work identically:

- `connect()` / `disconnect()`
- `getPower()` / `powerOn()` / `powerOff()`
- `getRoster()`
- `getLight()` / `setLight()` / `turnOnLight()` / `turnOffLight()` / `listLights()`
- `getTurnout()` / `setTurnout()` / `throwTurnout()` / `closeTurnout()` / `listTurnouts()`
- `acquireThrottle()` / `releaseThrottle()`
- `setThrottleSpeed()` / `setThrottleDirection()` / `setThrottleFunction()`
- All event emitters

## Limitations

- No real locomotives are controlled
- State resets when the client instance is discarded
- No actual JMRI server validation
- Simulated latency only (no real network variability)
- `configPath` requires Node.js — pass `config` objects in browser environments
