import { JmriClient, PowerState } from "../../dist/esm/index.js";

console.log('Connecting to raspi-jmri.local:12080...');

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

client.on('connected', async () => {
  console.log('✓ Connected to JMRI');

  try {
    // Test power
    console.log('\nTesting power control...');
    const power = await client.getPower();
    console.log(`Current power: ${power === PowerState.ON ? 'ON' : 'OFF'} (${power})`);

    // Test roster
    console.log('\nTesting roster...');
    const roster = await client.getRoster();
    console.log(`Found ${roster.length} locomotives`);
    if (roster.length > 0) {
      console.log('First 3:');
      roster.slice(0, 3).forEach(e => console.log(`  - ${e.name} (${e.address})`));
    }

    console.log('\n✓ All tests passed!');
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await client.disconnect();
    process.exit(1);
  }
});

client.on('error', (error) => {
  console.error('Connection error:', error.message);
  process.exit(1);
});

client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Timeout - could not connect to JMRI');
  process.exit(1);
}, 10000);
