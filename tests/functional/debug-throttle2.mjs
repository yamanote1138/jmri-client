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
    console.log('Requesting throttle for address 11...\n');
    const throttleId = await client.acquireThrottle({ address: 11 });
    console.log('\n✓ Got throttle:', throttleId);
    await client.releaseThrottle(throttleId);
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await client.disconnect();
    process.exit(1);
  }
});

setTimeout(() => process.exit(1), 10000);
