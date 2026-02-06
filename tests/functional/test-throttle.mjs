import { JmriClient } from "../../dist/esm/index.js";

console.log('Connecting to raspi-jmri.local:12080...');
console.log('Will test locomotive at address 11');
console.log('Max speed: 30%\n');

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

client.on('connected', async () => {
  console.log('✓ Connected to JMRI\n');

  try {
    // Ensure power is on
    console.log('Ensuring power is ON...');
    await client.powerOn();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Acquire throttle
    console.log(`Acquiring throttle for address 11...`);
    const throttleId = await client.acquireThrottle({ address: 11 });
    console.log(`✓ Throttle ID: ${throttleId}\n`);

    // Test speed control (max 30%)
    console.log('Testing speed control...');

    console.log('  15% speed...');
    await client.setThrottleSpeed(throttleId, 0.15);
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('  25% speed...');
    await client.setThrottleSpeed(throttleId, 0.25);
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('  30% speed (max)...');
    await client.setThrottleSpeed(throttleId, 0.30);
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('  Slowing to 15%...');
    await client.setThrottleSpeed(throttleId, 0.15);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('  Stop...');
    await client.setThrottleSpeed(throttleId, 0);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test direction
    console.log('\nTesting direction change...');
    console.log('  Reverse...');
    await client.setThrottleDirection(throttleId, false);
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('  20% reverse...');
    await client.setThrottleSpeed(throttleId, 0.2);
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('  Stop...');
    await client.setThrottleSpeed(throttleId, 0);
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('  Forward...');
    await client.setThrottleDirection(throttleId, true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test functions
    console.log('\nTesting functions...');
    console.log('  F0 (headlight) ON...');
    await client.setThrottleFunction(throttleId, 'F0', true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('  F2 (horn)...');
    await client.setThrottleFunction(throttleId, 'F2', true);
    await new Promise(resolve => setTimeout(resolve, 500));
    await client.setThrottleFunction(throttleId, 'F2', false);
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('  F0 (headlight) OFF...');
    await client.setThrottleFunction(throttleId, 'F0', false);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get final state
    console.log('\nFinal throttle state:');
    const state = client.getThrottleState(throttleId);
    if (state) {
      console.log(`  Address: ${state.address}`);
      console.log(`  Speed: ${state.speed}`);
      console.log(`  Direction: ${state.forward ? 'forward' : 'reverse'}`);
      console.log(`  Functions: ${Array.from(state.functions.entries()).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}`);
    }

    // Clean up
    console.log('\nReleasing throttle...');
    await client.releaseThrottle(throttleId);

    console.log('\n✓ All tests passed!');
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    await client.disconnect();
    process.exit(1);
  }
});

client.on('error', (error) => {
  console.error('Connection error:', error.message);
  process.exit(1);
});

client.on('throttle:acquired', (id) => {
  console.log(`  Event: throttle acquired (${id})`);
});

client.on('throttle:updated', (id, data) => {
  if (data.speed !== undefined || data.forward !== undefined) {
    console.log(`  Event: throttle updated - speed=${data.speed}, forward=${data.forward}`);
  }
});

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\nTimeout - test took too long');
  process.exit(1);
}, 60000);
