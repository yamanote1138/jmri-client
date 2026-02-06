import { JmriClient } from "../../dist/esm/index.js";
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (message) => new Promise((resolve) => {
  rl.question(`\n${message}\nPress Enter to continue...`, () => resolve());
});

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

client.on('connected', async () => {
  console.log('✓ Connected to JMRI\n');
  console.log('='.repeat(60));
  console.log('INTERACTIVE THROTTLE TEST');
  console.log('Locomotive Address: 11');
  console.log('Max Speed: 30%');
  console.log('='.repeat(60));

  try {
    // Test 1: Power Off
    console.log('\n[TEST 1] Power Off');
    console.log('Action: Turning track power OFF...');
    await client.powerOff();
    await prompt('✓ Track power is OFF. Verify no locomotives are running.');

    // Test 2: Power On
    console.log('\n[TEST 2] Power On');
    console.log('Action: Turning track power ON...');
    await client.powerOn();
    await prompt('✓ Track power is ON. Verify power indicators are lit.');

    // Test 3: Acquire Throttle
    console.log('\n[TEST 3] Acquire Throttle');
    console.log('Action: Acquiring throttle for locomotive 11...');
    const throttleId = await client.acquireThrottle({ address: 11 });
    console.log(`✓ Throttle acquired: ${throttleId}`);
    await prompt('Throttle ready. Locomotive should be responsive.');

    // Test 4: Forward Direction at 15%
    console.log('\n[TEST 4] Forward Direction - 15% Speed');
    console.log('Action: Setting direction to FORWARD...');
    await client.setThrottleDirection(throttleId, true);
    console.log('Action: Setting speed to 15%...');
    await client.setThrottleSpeed(throttleId, 0.15);
    await prompt('✓ Locomotive should be moving FORWARD slowly (15%).');

    // Test 5: Increase to 25%
    console.log('\n[TEST 5] Increase Speed to 25%');
    console.log('Action: Setting speed to 25%...');
    await client.setThrottleSpeed(throttleId, 0.25);
    await prompt('✓ Locomotive should be moving FORWARD faster (25%).');

    // Test 6: Maximum Speed (30%)
    console.log('\n[TEST 6] Maximum Speed (30%)');
    console.log('Action: Setting speed to 30%...');
    await client.setThrottleSpeed(throttleId, 0.30);
    await prompt('✓ Locomotive should be at maximum speed FORWARD (30%).');

    // Test 7: Stop
    console.log('\n[TEST 7] Stop');
    console.log('Action: Setting speed to 0%...');
    await client.setThrottleSpeed(throttleId, 0);
    await prompt('✓ Locomotive should have stopped.');

    // Test 8: Reverse Direction at 20%
    console.log('\n[TEST 8] Reverse Direction - 20% Speed');
    console.log('Action: Setting direction to REVERSE...');
    await client.setThrottleDirection(throttleId, false);
    console.log('Action: Setting speed to 20%...');
    await client.setThrottleSpeed(throttleId, 0.20);
    await prompt('✓ Locomotive should be moving REVERSE (20%).');

    // Test 9: Stop
    console.log('\n[TEST 9] Stop');
    console.log('Action: Setting speed to 0%...');
    await client.setThrottleSpeed(throttleId, 0);
    await prompt('✓ Locomotive should have stopped.');

    // Test 10: Forward Direction Again
    console.log('\n[TEST 10] Return to Forward Direction');
    console.log('Action: Setting direction to FORWARD...');
    await client.setThrottleDirection(throttleId, true);
    await prompt('✓ Direction set to FORWARD (locomotive still stopped).');

    // Test 11: Headlight (F0)
    console.log('\n[TEST 11] Headlight On (F0)');
    console.log('Action: Turning headlight ON...');
    await client.setThrottleFunction(throttleId, 'F0', true);
    await prompt('✓ Headlight should be ON.');

    // Test 12: Horn (F2)
    console.log('\n[TEST 12] Horn (F2)');
    console.log('Action: Activating horn...');
    await client.setThrottleFunction(throttleId, 'F2', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await client.setThrottleFunction(throttleId, 'F2', false);
    await prompt('✓ Horn should have sounded.');

    // Test 13: Headlight Off
    console.log('\n[TEST 13] Headlight Off');
    console.log('Action: Turning headlight OFF...');
    await client.setThrottleFunction(throttleId, 'F0', false);
    await prompt('✓ Headlight should be OFF.');

    // Test 14: Release Throttle
    console.log('\n[TEST 14] Release Throttle');
    console.log('Action: Releasing throttle...');
    await client.releaseThrottle(throttleId);
    console.log('✓ Throttle released');

    // Final State
    console.log('\n' + '='.repeat(60));
    console.log('✓ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    rl.close();
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    rl.close();
    await client.disconnect();
    process.exit(1);
  }
});

client.on('error', (error) => {
  console.error('Connection error:', error.message);
  rl.close();
  process.exit(1);
});

setTimeout(() => {
  console.error('\nTimeout - test took too long');
  rl.close();
  process.exit(1);
}, 300000); // 5 minutes timeout
