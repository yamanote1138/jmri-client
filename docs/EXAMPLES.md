# Examples

## Basic Power Control

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

## Running a Locomotive

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

## Monitoring Real-Time Updates

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

## Multiple Throttles

```typescript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({ host: 'jmri.local' });

client.on('connected', async () => {
  await client.powerOn();

  // Control multiple locomotives
  const loco1 = await client.acquireThrottle({ address: 3 });
  const loco2 = await client.acquireThrottle({ address: 754 });

  // Run them at different speeds
  await client.setThrottleSpeed(loco1, 0.3);
  await client.setThrottleSpeed(loco2, 0.5);

  // Both forward
  await client.setThrottleDirection(loco1, true);
  await client.setThrottleDirection(loco2, true);

  // Release when done
  await client.releaseAllThrottles();
});
```

## Roster Search

```typescript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({ host: 'jmri.local' });

client.on('connected', async () => {
  // Get all roster entries
  const roster = await client.getRoster();
  console.log(`Found ${roster.length} locomotives`);

  // Search for steam locomotives
  const steamLocos = await client.searchRoster('steam');
  console.log('Steam locomotives:', steamLocos.map(e => e.name));

  // Find by address
  const loco = await client.getRosterEntryByAddress(3);
  if (loco) {
    console.log(`Found: ${loco.name} at address ${loco.address}`);
  }

  await client.disconnect();
});
```

## Error Handling

```typescript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({
  host: 'jmri.local',
  reconnection: {
    enabled: true,
    maxAttempts: 5
  }
});

client.on('error', (error) => {
  console.error('Client error:', error.message);
});

client.on('reconnectionFailed', (attempts) => {
  console.error(`Failed to reconnect after ${attempts} attempts`);
  process.exit(1);
});

client.on('connected', async () => {
  try {
    const throttle = await client.acquireThrottle({ address: 3 });
    await client.setThrottleSpeed(throttle, 0.5);
  } catch (error) {
    console.error('Operation failed:', error);
  }
});
```

## Custom Configuration

```typescript
import { JmriClient } from 'jmri-client';

const client = new JmriClient({
  host: 'jmri.local',
  port: 12080,
  protocol: 'ws',
  autoConnect: false,  // Manual connection control

  reconnection: {
    enabled: true,
    maxAttempts: 10,
    initialDelay: 500,
    maxDelay: 10000,
    multiplier: 2,
    jitter: true
  },

  heartbeat: {
    enabled: true,
    interval: 15000,  // Ping every 15 seconds
    timeout: 3000     // Wait 3 seconds for pong
  },

  messageQueueSize: 50,
  requestTimeout: 5000
});

// Connect when ready
await client.connect();

// Do work...

// Disconnect cleanly
await client.disconnect();
```

## Using with async/await

```typescript
import { JmriClient, PowerState } from 'jmri-client';

async function runLayout() {
  const client = new JmriClient({
    host: 'jmri.local',
    autoConnect: false
  });

  try {
    // Connect
    await client.connect();
    console.log('Connected');

    // Power on
    await client.powerOn();
    console.log('Power on');

    // Run locomotive
    const throttle = await client.acquireThrottle({ address: 3 });
    await client.setThrottleSpeed(throttle, 0.5);
    await new Promise(resolve => setTimeout(resolve, 10000));
    await client.setThrottleSpeed(throttle, 0);
    await client.releaseThrottle(throttle);

    // Power off
    await client.powerOff();
    console.log('Power off');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
    console.log('Disconnected');
  }
}

runLayout();
```

## CommonJS Usage

```javascript
const { JmriClient, PowerState } = require('jmri-client');

const client = new JmriClient({ host: 'jmri.local' });

client.on('connected', async () => {
  const power = await client.getPower();
  console.log('Power:', power === PowerState.ON ? 'ON' : 'OFF');
});
```
