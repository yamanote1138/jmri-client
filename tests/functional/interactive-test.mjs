import { JmriClient } from "../../dist/esm/index.js";
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let client;
let throttleId;

// Prompt for input
function ask(question, defaultValue) {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Prompt to continue
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`\n${message}\nPress Enter to continue... `, () => {
      resolve();
    });
  });
}

// Safety: ensure power off on exit
async function safeExit(code = 0) {
  try {
    if (client) {
      console.log('\n→ Safety: Turning power OFF...');
      await client.powerOff();
      console.log('✓ Power OFF');
      await client.disconnect();
    }
  } catch (error) {
    console.error('Warning: Could not safely shut down:', error.message);
  }
  rl.close();
  process.exit(code);
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Emergency Stop (Ctrl+C)');
  await safeExit(1);
});

// Main test flow
async function runTest() {
  console.log('='.repeat(70));
  console.log('JMRI CLIENT - INTERACTIVE TEST');
  console.log('='.repeat(70));
  console.log('\nSafety: Press Ctrl+C at any time for emergency stop\n');

  try {
    // Get configuration
    const host = await ask('JMRI hostname or IP', 'raspi-jmri.local');
    const port = await ask('JMRI port', '12080');
    const address = await ask('Locomotive address', '11');

    console.log('\n→ Connecting to JMRI at ' + host + ':' + port + '...');

    // Create client
    client = new JmriClient({
      host: host,
      port: parseInt(port),
      autoConnect: true
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      client.on('connected', resolve);
      client.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    console.log('✓ Connected to JMRI\n');

    // Test 1: Power ON
    console.log('[STEP 1] Turn Power ON');
    console.log('→ Turning track power ON...');
    await client.powerOn();
    console.log('✓ Track power is ON');
    await confirm('Verify: Power indicators should be lit');

    // Test 2: Power OFF
    console.log('\n[STEP 2] Turn Power OFF');
    console.log('→ Turning track power OFF...');
    await client.powerOff();
    console.log('✓ Track power is OFF');
    await confirm('Verify: Power indicators should be off');

    // Test 3: Power ON and Acquire Throttle
    console.log('\n[STEP 3] Turn Power ON and Acquire Throttle');
    console.log('→ Turning track power ON...');
    await client.powerOn();
    console.log('✓ Track power is ON');
    console.log(`→ Acquiring throttle for locomotive ${address}...`);
    throttleId = await client.acquireThrottle({ address: parseInt(address) });
    console.log(`✓ Throttle acquired: ${throttleId}`);
    await confirm('Verify: Throttle ready');

    // Test 4: Forward Direction
    console.log('\n[STEP 4] Set Direction to Forward');
    console.log('→ Setting direction to FORWARD...');
    await client.setThrottleDirection(throttleId, true);
    console.log('✓ Direction set to FORWARD');

    // Test 5: Speed 10%
    console.log('\n[STEP 5] Set Speed to 10%');
    console.log('→ Setting speed to 10%...');
    await client.setThrottleSpeed(throttleId, 0.10);
    console.log('✓ Speed set to 10%');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 6: Speed 20%
    console.log('\n[STEP 6] Set Speed to 20%');
    console.log('→ Setting speed to 20%...');
    await client.setThrottleSpeed(throttleId, 0.20);
    console.log('✓ Speed set to 20%');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 7: Speed 30%
    console.log('\n[STEP 7] Set Speed to 30%');
    console.log('→ Setting speed to 30%...');
    await client.setThrottleSpeed(throttleId, 0.30);
    console.log('✓ Speed set to 30%');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 8: Stop
    console.log('\n[STEP 8] Stop');
    console.log('→ Setting speed to 0%...');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Locomotive stopped');
    await confirm('Verify: Locomotive should be stopped moving forward');

    // Test 9: Reverse Direction
    console.log('\n[STEP 9] Set Direction to Reverse');
    console.log('→ Setting direction to REVERSE...');
    await client.setThrottleDirection(throttleId, false);
    console.log('✓ Direction set to REVERSE');

    // Test 10: Speed 10% Reverse
    console.log('\n[STEP 10] Set Speed to 10% (Reverse)');
    console.log('→ Setting speed to 10%...');
    await client.setThrottleSpeed(throttleId, 0.10);
    console.log('✓ Speed set to 10%');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 11: Speed 20% Reverse
    console.log('\n[STEP 11] Set Speed to 20% (Reverse)');
    console.log('→ Setting speed to 20%...');
    await client.setThrottleSpeed(throttleId, 0.20);
    console.log('✓ Speed set to 20%');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 12: Speed 30% Reverse
    console.log('\n[STEP 12] Set Speed to 30% (Reverse)');
    console.log('→ Setting speed to 30%...');
    await client.setThrottleSpeed(throttleId, 0.30);
    console.log('✓ Speed set to 30%');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 13: Stop
    console.log('\n[STEP 13] Stop');
    console.log('→ Setting speed to 0%...');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Locomotive stopped');
    await confirm('Verify: Locomotive should be stopped moving in reverse');

    // Test 14: Headlight ON
    console.log('\n[STEP 14] Headlight ON');
    console.log('→ Turning headlight ON (F0)...');
    await client.setThrottleFunction(throttleId, 'F0', true);
    console.log('✓ Headlight ON');
    await confirm('Verify: Headlight should be ON');

    // Test 15: Headlight OFF
    console.log('\n[STEP 15] Headlight OFF');
    console.log('→ Turning headlight OFF (F0)...');
    await client.setThrottleFunction(throttleId, 'F0', false);
    console.log('✓ Headlight OFF');
    await confirm('Verify: Headlight should be OFF');

    // Test 16: Release Throttle
    console.log('\n[STEP 16] Release Throttle');
    console.log('→ Releasing throttle...');
    await client.releaseThrottle(throttleId);
    throttleId = null;
    console.log('✓ Throttle released');

    // Test 17: Power OFF
    console.log('\n[STEP 17] Turn Power OFF');
    console.log('→ Turning track power OFF...');
    await client.powerOff();
    console.log('✓ Track power OFF');

    // Success
    console.log('\n' + '='.repeat(70));
    console.log('✓ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

    await client.disconnect();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    await safeExit(1);
  }
}

// Start the test
runTest();
