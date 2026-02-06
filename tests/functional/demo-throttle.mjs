import { JmriClient } from "../../dist/esm/index.js";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

// Safety: ensure power off on exit
async function safeExit(code = 0) {
  try {
    console.log('\n→ Safety: Turning power OFF...');
    await client.powerOff();
    console.log('✓ Power OFF');
  } catch (error) {
    console.error('Warning: Could not turn power off:', error.message);
  }
  await client.disconnect();
  process.exit(code);
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Interrupted (Ctrl+C)');
  await safeExit(1);
});

client.on('connected', async () => {
  console.log('✓ Connected to JMRI\n');
  console.log('='.repeat(60));
  console.log('THROTTLE DEMONSTRATION');
  console.log('Locomotive Address: 11');
  console.log('Max Speed: 30%');
  console.log('='.repeat(60));

  try {
    // Test 1: Power Off
    console.log('\n[TEST 1] Power Off');
    console.log('→ Turning track power OFF...');
    await client.powerOff();
    console.log('✓ Track power is OFF');
    await wait(3000);

    // Test 2: Power On
    console.log('\n[TEST 2] Power On');
    console.log('→ Turning track power ON...');
    await client.powerOn();
    console.log('✓ Track power is ON');
    await wait(2000);

    // Test 3: Acquire Throttle
    console.log('\n[TEST 3] Acquire Throttle');
    console.log('→ Acquiring throttle for locomotive 11...');
    const throttleId = await client.acquireThrottle({ address: 11 });
    console.log(`✓ Throttle acquired: ${throttleId}`);
    await wait(2000);

    // Test 4: Forward Direction at 15%
    console.log('\n[TEST 4] Forward Direction - 15% Speed');
    console.log('→ Setting direction to FORWARD...');
    await client.setThrottleDirection(throttleId, true);
    console.log('→ Setting speed to 15%...');
    await client.setThrottleSpeed(throttleId, 0.15);
    console.log('✓ Moving FORWARD at 15%');
    await wait(4000);

    // Test 5: Increase to 25%
    console.log('\n[TEST 5] Increase Speed to 25%');
    console.log('→ Setting speed to 25%...');
    await client.setThrottleSpeed(throttleId, 0.25);
    console.log('✓ Moving FORWARD at 25%');
    await wait(4000);

    // Test 6: Maximum Speed (30%)
    console.log('\n[TEST 6] Maximum Speed (30%)');
    console.log('→ Setting speed to 30%...');
    await client.setThrottleSpeed(throttleId, 0.30);
    console.log('✓ Moving FORWARD at 30% (maximum)');
    await wait(4000);

    // Test 7: Slow Down to 15%
    console.log('\n[TEST 7] Slow Down to 15%');
    console.log('→ Setting speed to 15%...');
    await client.setThrottleSpeed(throttleId, 0.15);
    console.log('✓ Moving FORWARD at 15%');
    await wait(3000);

    // Test 8: Stop
    console.log('\n[TEST 8] Stop');
    console.log('→ Setting speed to 0%...');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Locomotive stopped');
    await wait(2000);

    // Test 9: Reverse Direction at 20%
    console.log('\n[TEST 9] Reverse Direction - 20% Speed');
    console.log('→ Setting direction to REVERSE...');
    await client.setThrottleDirection(throttleId, false);
    console.log('→ Setting speed to 20%...');
    await client.setThrottleSpeed(throttleId, 0.20);
    console.log('✓ Moving REVERSE at 20%');
    await wait(4000);

    // Test 10: Stop
    console.log('\n[TEST 10] Stop');
    console.log('→ Setting speed to 0%...');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Locomotive stopped');
    await wait(2000);

    // Test 11: Forward Direction Again
    console.log('\n[TEST 11] Return to Forward Direction');
    console.log('→ Setting direction to FORWARD...');
    await client.setThrottleDirection(throttleId, true);
    console.log('✓ Direction set to FORWARD (stopped)');
    await wait(2000);

    // Test 12: Headlight (F0)
    console.log('\n[TEST 12] Headlight On (F0)');
    console.log('→ Turning headlight ON...');
    await client.setThrottleFunction(throttleId, 'F0', true);
    console.log('✓ Headlight ON');
    await wait(3000);

    // Test 13: Horn (F2)
    console.log('\n[TEST 13] Horn (F2)');
    console.log('→ Activating horn...');
    await client.setThrottleFunction(throttleId, 'F2', true);
    await wait(1500);
    await client.setThrottleFunction(throttleId, 'F2', false);
    console.log('✓ Horn sounded');
    await wait(2000);

    // Test 14: Headlight Off
    console.log('\n[TEST 14] Headlight Off');
    console.log('→ Turning headlight OFF...');
    await client.setThrottleFunction(throttleId, 'F0', false);
    console.log('✓ Headlight OFF');
    await wait(2000);

    // Test 15: Quick Movement Test
    console.log('\n[TEST 15] Quick Movement Test');
    console.log('→ Moving forward at 20%...');
    await client.setThrottleSpeed(throttleId, 0.20);
    await wait(3000);
    console.log('→ Stopping...');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Movement test complete');
    await wait(2000);

    // Test 16: Release Throttle
    console.log('\n[TEST 16] Release Throttle');
    console.log('→ Releasing throttle...');
    await client.releaseThrottle(throttleId);
    console.log('✓ Throttle released');

    // Test 17: Power Off (SAFETY)
    console.log('\n[TEST 17] Power Off');
    console.log('→ Turning track power OFF...');
    await client.powerOff();
    console.log('✓ Track power OFF');

    // Final State
    console.log('\n' + '='.repeat(60));
    console.log('✓ DEMONSTRATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\nThrottle demonstration completed successfully!');
    console.log('The locomotive should now be stopped with power OFF.');

    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    await safeExit(1);
  }
});

client.on('error', async (error) => {
  console.error('Connection error:', error.message);
  await safeExit(1);
});

client.on('throttle:updated', (id, data) => {
  if (data.speed !== undefined) {
    console.log(`  [Event] Speed updated: ${(data.speed * 100).toFixed(1)}%`);
  }
});

setTimeout(() => {
  console.error('\nTimeout - test took too long');
  process.exit(1);
}, 120000); // 2 minute timeout
