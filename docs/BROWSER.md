# Browser Usage Guide

jmri-client v3.1.0+ supports both Node.js and browser environments. This guide shows how to use jmri-client in web applications.

## Installation

```bash
npm install jmri-client
```

## Browser Compatibility

jmri-client automatically detects the environment and uses:
- **Browser**: Native `WebSocket` API
- **Node.js**: `ws` package

No configuration or polyfills required!

## Basic Usage

### Using a Module Bundler (Recommended)

With Webpack, Vite, Rollup, or similar bundlers:

```javascript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({
  host: 'localhost',  // or your JMRI server IP
  port: 12080,
  protocol: 'ws'      // or 'wss' for secure connections
});

// Listen for events
client.on('connected', () => {
  console.log('Connected to JMRI!');
});

client.on('throttle:updated', (id, data) => {
  console.log('Throttle updated:', id, data);
});

// Connect
await client.connect();

// Acquire a throttle
const throttleId = await client.acquireThrottle({ address: 3 });

// Control the throttle
await client.setThrottleSpeed(throttleId, 0.5);  // Half speed
await client.setThrottleFunction(throttleId, 'F0', true);  // Headlight on
```

### Using a CDN (ES Modules)

For quick prototypes without a build step:

```html
<!DOCTYPE html>
<html>
<head>
  <title>JMRI Control</title>
</head>
<body>
  <h1>JMRI Throttle Control</h1>
  <button id="connect">Connect</button>
  <button id="powerOn">Power On</button>
  <button id="speed">Set Speed 50%</button>

  <script type="module">
    import { JmriClient } from 'https://cdn.jsdelivr.net/npm/jmri-client@3.1.0/dist/esm/index.js';

    const client = new JmriClient({
      host: 'localhost',
      port: 12080
    });

    client.on('connected', () => {
      console.log('Connected!');
      document.getElementById('connect').textContent = 'Connected';
    });

    document.getElementById('connect').onclick = async () => {
      await client.connect();
    };

    document.getElementById('powerOn').onclick = async () => {
      await client.powerOn();
      console.log('Power on!');
    };

    document.getElementById('speed').onclick = async () => {
      const throttleId = await client.acquireThrottle({ address: 3 });
      await client.setThrottleSpeed(throttleId, 0.5);
      console.log('Speed set!');
    };
  </script>
</body>
</html>
```

## React Example

```jsx
import { useEffect, useState } from 'react';
import { JmriClient, PowerState } from 'jmri-client';

function ThrottleControl() {
  const [client] = useState(() => new JmriClient({
    host: 'localhost',
    port: 12080,
    autoConnect: false
  }));

  const [connected, setConnected] = useState(false);
  const [throttleId, setThrottleId] = useState(null);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    // Set up event listeners
    client.on('connected', () => setConnected(true));
    client.on('disconnected', () => setConnected(false));

    client.on('throttle:updated', (id, data) => {
      if (data.speed !== undefined) {
        setSpeed(data.speed);
      }
    });

    // Connect on mount
    client.connect();

    // Cleanup on unmount
    return () => {
      client.disconnect();
    };
  }, [client]);

  const acquireThrottle = async () => {
    const id = await client.acquireThrottle({ address: 3 });
    setThrottleId(id);
  };

  const handleSpeedChange = async (newSpeed) => {
    if (throttleId) {
      await client.setThrottleSpeed(throttleId, newSpeed);
    }
  };

  return (
    <div>
      <h2>Throttle Control</h2>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>

      {!throttleId && (
        <button onClick={acquireThrottle}>Acquire Throttle</button>
      )}

      {throttleId && (
        <div>
          <p>Speed: {(speed * 100).toFixed(0)}%</p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}

export default ThrottleControl;
```

## Vue Example

```vue
<template>
  <div>
    <h2>JMRI Control</h2>
    <p>Status: {{ connected ? 'Connected' : 'Disconnected' }}</p>

    <button @click="powerOn" :disabled="!connected">Power On</button>
    <button @click="powerOff" :disabled="!connected">Power Off</button>

    <div v-if="throttleId">
      <p>Speed: {{ (speed * 100).toFixed(0) }}%</p>
      <input
        type="range"
        v-model.number="speed"
        min="0"
        max="1"
        step="0.01"
        @input="setSpeed"
      />
    </div>
  </div>
</template>

<script>
import { JmriClient } from 'jmri-client';

export default {
  data() {
    return {
      client: null,
      connected: false,
      throttleId: null,
      speed: 0
    };
  },

  mounted() {
    this.client = new JmriClient({
      host: 'localhost',
      port: 12080
    });

    this.client.on('connected', () => {
      this.connected = true;
      this.acquireThrottle();
    });

    this.client.on('disconnected', () => {
      this.connected = false;
    });

    this.client.on('throttle:updated', (id, data) => {
      if (data.speed !== undefined) {
        this.speed = data.speed;
      }
    });
  },

  beforeUnmount() {
    if (this.client) {
      this.client.disconnect();
    }
  },

  methods: {
    async acquireThrottle() {
      this.throttleId = await this.client.acquireThrottle({ address: 3 });
    },

    async powerOn() {
      await this.client.powerOn();
    },

    async powerOff() {
      await this.client.powerOff();
    },

    async setSpeed() {
      if (this.throttleId) {
        await this.client.setThrottleSpeed(this.throttleId, this.speed);
      }
    }
  }
};
</script>
```

## CORS Considerations

If your JMRI server and web app are on different origins, you may need to configure CORS on the JMRI server. WebSocket connections from browsers are subject to CORS policies.

## Mock Mode in Browser

Mock mode works great in browsers for testing and demos without a real JMRI server:

```javascript
const client = new JmriClient({
  host: 'localhost',
  port: 12080,
  mock: {
    enabled: true,
    responseDelay: 50
  }
});

await client.connect();  // Instant connection in mock mode
const throttleId = await client.acquireThrottle({ address: 3 });
await client.setThrottleSpeed(throttleId, 0.75);  // Mock responds immediately
```

## Security Notes

- Use `wss://` (secure WebSocket) for production deployments
- Never expose JMRI servers directly to the public internet
- Consider using a reverse proxy with authentication for remote access

## Browser Support

jmri-client works in all modern browsers that support:
- ES2020
- Native WebSocket API
- EventTarget

Tested in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### "Mixed Content" Error

If your webpage is served over HTTPS but trying to connect to `ws://` (not `wss://`):
- Use `wss://` for secure connections
- Or serve your webpage over HTTP during development

### Connection Refused

- Verify JMRI Web Server is running (check JMRI preferences)
- Ensure the port (default 12080) is correct
- Check firewall settings
- Verify the host/IP address is reachable

## Next Steps

- See [API.md](./API.md) for complete API documentation
- Check [EXAMPLES.md](./EXAMPLES.md) for more usage examples
- Read [MOCK_MODE.md](./MOCK_MODE.md) for testing without hardware
