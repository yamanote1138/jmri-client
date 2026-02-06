import { JmriClient } from "../../dist/esm/index.js";

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

client.on('connected', async () => {
  console.log('✓ Connected\n');

  try {
    console.log('Acquiring throttle for address 11...');
    const throttle = await client.acquireThrottle({ address: 11 });
    console.log('✓ Throttle acquired:', throttle);

    console.log('\nReleasing throttle...');
    await client.releaseThrottle(throttle);
    console.log('✓ Throttle released');

    console.log('\n✓ Test passed!');
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    await client.disconnect();
    process.exit(1);
  }
});

client.on('error', (error) => {
  console.error('Error:', error.message);
});

setTimeout(() => {
  console.error('Timeout');
  process.exit(1);
}, 10000);
