import { JmriClient } from "../../dist/esm/index.js";
import * as readline from 'readline';

const client = new JmriClient({
  host: 'raspi-jmri.local',
  port: 12080,
  autoConnect: true
});

let rl;
let throttleId;

// Safety: ensure power off on exit
async function safeExit(code = 0) {
  try {
    console.log('\n→ Safety: Turning power OFF...');
    await client.powerOff();
    console.log('✓ Power OFF');
  } catch (error) {
    console.error('Warning: Could not turn power off:', error.message);
  }

  if (rl) {
    rl.close();
  }

  await client.disconnect();
  process.exit(code);
}

// Prompt with option to exit
function prompt(message) {
  return new Promise((resolve, reject) => {
    rl.question(`\n${message}\n[Press Enter to continue, or type 'exit' to stop] `, (answer) => {
      if (answer.toLowerCase().trim() === 'exit') {
        console.log('\n🛑 User requested exit');
        reject(new Error('USER_EXIT'));
      } else {
        resolve();
      }
    });
  });
}

client.on('connected', async () => {
  console.log('✓ Connected to JMRI\n');
  console.log('='.repeat(70));
  console.log('INTERACTIVE THROTTLE DEMONSTRATION');
  console.log('Locomotive Address: 11');
  console.log('Max Speed: 30%');
  console.log('='.repeat(70));
  console.log('\nSAFETY: You can type "exit" at any prompt to stop and power off.');
  console.log('='.repeat(70));

  // Initialize readline after connection
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Test 1: Power Off
    await prompt('\n[STEP 1] Power Off\n→ Will turn track power OFF');
    await client.powerOff();
    console.log('✓ Track power is OFF');
    await prompt('Verify: No locomotives running, power indicators off');

    // Test 2: Power On
    await prompt('\n[STEP 2] Power On\n→ Will turn track power ON');
    await client.powerOn();
    console.log('✓ Track power is ON');
    await prompt('Verify: Power indicators lit');

    // Test 3: Acquire Throttle
    await prompt('\n[STEP 3] Acquire Throttle\n→ Will acquire throttle for locomotive 11');
    throttleId = await client.acquireThrottle({ address: 11 });
    console.log(`✓ Throttle acquired: ${throttleId}`);
    await prompt('Throttle ready');

    // Test 4: Forward Direction at 15%
    await prompt('\n[STEP 4] Forward at 15%\n→ Will set FORWARD direction and 15% speed');
    await client.setThrottleDirection(throttleId, true);
    await client.setThrottleSpeed(throttleId, 0.15);
    console.log('✓ Moving FORWARD at 15%');
    await prompt('Verify: Locomotive moving forward slowly');

    // Test 5: Increase to 25%
    await prompt('\n[STEP 5] Increase to 25%\n→ Will increase speed to 25%');
    await client.setThrottleSpeed(throttleId, 0.25);
    console.log('✓ Moving FORWARD at 25%');
    await prompt('Verify: Locomotive moving faster');

    // Test 6: Maximum Speed (30%)
    await prompt('\n[STEP 6] Maximum Speed (30%)\n→ Will increase to maximum speed 30%');
    await client.setThrottleSpeed(throttleId, 0.30);
    console.log('✓ Moving FORWARD at 30% (maximum)');
    await prompt('Verify: Locomotive at maximum speed');

    // Test 7: Slow Down
    await prompt('\n[STEP 7] Slow Down to 15%\n→ Will reduce speed to 15%');
    await client.setThrottleSpeed(throttleId, 0.15);
    console.log('✓ Slowed to 15%');
    await prompt('Verify: Locomotive slowed down');

    // Test 8: Stop
    await prompt('\n[STEP 8] Stop\n→ Will stop locomotive (speed to 0)');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Locomotive stopped');
    await prompt('Verify: Locomotive stopped');

    // Test 9: Reverse Direction
    await prompt('\n[STEP 9] Reverse at 20%\n→ Will set REVERSE direction and 20% speed');
    await client.setThrottleDirection(throttleId, false);
    await client.setThrottleSpeed(throttleId, 0.20);
    console.log('✓ Moving REVERSE at 20%');
    await prompt('Verify: Locomotive moving in reverse');

    // Test 10: Stop
    await prompt('\n[STEP 10] Stop\n→ Will stop locomotive');
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Locomotive stopped');
    await prompt('Verify: Locomotive stopped');

    // Test 11: Forward Direction
    await prompt('\n[STEP 11] Forward Direction\n→ Will set direction to FORWARD (still stopped)');
    await client.setThrottleDirection(throttleId, true);
    console.log('✓ Direction set to FORWARD');
    await prompt('Verify: Direction changed (still stopped)');

    // Test 12: Headlight
    await prompt('\n[STEP 12] Headlight On (F0)\n→ Will turn headlight ON');
    await client.setThrottleFunction(throttleId, 'F0', true);
    console.log('✓ Headlight ON');
    await prompt('Verify: Headlight is on');

    // Test 13: Horn
    await prompt('\n[STEP 13] Horn (F2)\n→ Will activate horn for 1.5 seconds');
    await client.setThrottleFunction(throttleId, 'F2', true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await client.setThrottleFunction(throttleId, 'F2', false);
    console.log('✓ Horn sounded');
    await prompt('Verify: Horn sounded');

    // Test 14: Headlight Off
    await prompt('\n[STEP 14] Headlight Off\n→ Will turn headlight OFF');
    await client.setThrottleFunction(throttleId, 'F0', false);
    console.log('✓ Headlight OFF');
    await prompt('Verify: Headlight is off');

    // Test 15: Quick Movement
    await prompt('\n[STEP 15] Quick Movement Test\n→ Will move forward at 20% for 3 seconds then stop');
    await client.setThrottleSpeed(throttleId, 0.20);
    console.log('✓ Moving at 20%');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await client.setThrottleSpeed(throttleId, 0);
    console.log('✓ Stopped');
    await prompt('Verify: Locomotive moved and stopped');

    // Test 16: Release Throttle
    await prompt('\n[STEP 16] Release Throttle\n→ Will release throttle control');
    await client.releaseThrottle(throttleId);
    throttleId = null;
    console.log('✓ Throttle released');

    // Final: Power Off
    await prompt('\n[FINAL] Power Off\n→ Will turn track power OFF');
    await client.powerOff();
    console.log('✓ Track power OFF');

    console.log('\n' + '='.repeat(70));
    console.log('✓ DEMONSTRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

    rl.close();
    await client.disconnect();
    process.exit(0);

  } catch (error) {
    if (error.message === 'USER_EXIT') {
      console.log('\n→ Cleaning up...');

      // Try to release throttle if we have one
      if (throttleId) {
        try {
          console.log('→ Releasing throttle...');
          await client.releaseThrottle(throttleId);
          console.log('✓ Throttle released');
        } catch (e) {
          console.error('Warning: Could not release throttle:', e.message);
        }
      }

      await safeExit(0);
    } else {
      console.error('\n✗ Error:', error.message);
      console.error(error.stack);
      await safeExit(1);
    }
  }
});

client.on('error', async (error) => {
  console.error('Connection error:', error.message);
  await safeExit(1);
});

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Interrupted (Ctrl+C)');
  await safeExit(1);
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('\n✗ Uncaught error:', error.message);
  await safeExit(1);
});

process.on('unhandledRejection', async (error) => {
  console.error('\n✗ Unhandled rejection:', error);
  await safeExit(1);
});

// Timeout safety - 10 minutes
setTimeout(async () => {
  console.error('\n⏱️  Timeout - session exceeded 10 minutes');
  await safeExit(1);
}, 600000);

console.log('Connecting to JMRI at raspi-jmri.local:12080...');
console.log('Press Ctrl+C at any time to safely shut down.\n');
