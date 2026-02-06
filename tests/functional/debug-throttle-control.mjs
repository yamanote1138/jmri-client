import { JmriClient } from "../../dist/esm/index.js";

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

// Access internal wsClient to see messages
const wsClient = client.wsClient;
wsClient.on('message:sent', (msg) => {
  console.log('→ SENT:', JSON.stringify(msg, null, 2));
});

wsClient.on('message:received', (msg) => {
  console.log('← RECEIVED:', JSON.stringify(msg, null, 2));
});

client.on('connected', async () => {
  console.log('Connected\n');

  try {
    console.log('=== Acquiring throttle ===\n');
    const throttleId = await client.acquireThrottle({ address: 11 });
    console.log('\n✓ Throttle acquired:', throttleId);

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== Setting direction to FORWARD ===\n');
    await client.setThrottleDirection(throttleId, true);
    console.log('\n✓ Direction set');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== Setting speed to 0.15 ===\n');
    await client.setThrottleSpeed(throttleId, 0.15);
    console.log('\n✓ Speed set');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Setting speed to 0 ===\n');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('\n✓ Speed set to 0');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== Releasing throttle ===\n');
    await client.releaseThrottle(throttleId);
    console.log('\n✓ Released');

    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await client.disconnect();
    process.exit(1);
  }
});

setTimeout(() => process.exit(1), 30000);
