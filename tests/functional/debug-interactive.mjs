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
  console.log('JMRI CLIENT - INTERACTIVE TEST (DEBUG MODE)');
  console.log('='.repeat(70));
  console.log('\nThis will show all WebSocket messages to help diagnose issues.\n');

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

    // Log all WebSocket messages
    const wsClient = client.wsClient;
    wsClient.on('message:sent', (msg) => {
      console.log('\n→ SENT:', JSON.stringify(msg, null, 2));
    });

    wsClient.on('message:received', (msg) => {
      console.log('\n← RECEIVED:', JSON.stringify(msg, null, 2));
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      client.on('connected', resolve);
      client.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    console.log('\n✓ Connected to JMRI\n');

    // Test 1: Power ON
    console.log('[STEP 1] Turn Power ON');
    await client.powerOn();
    console.log('✓ Track power is ON');
    await confirm('Verify: Power indicators should be lit');

    // Test 2: Power OFF
    console.log('\n[STEP 2] Turn Power OFF');
    await client.powerOff();
    console.log('✓ Track power is OFF');
    await confirm('Verify: Power indicators should be off');

    // Test 3: Power ON and Acquire Throttle
    console.log('\n[STEP 3] Turn Power ON and Acquire Throttle');
    await client.powerOn();
    console.log('✓ Track power is ON');

    console.log(`\n→ Attempting to acquire throttle for address ${address}...`);
    console.log('   Watch for error messages in the response below:\n');

    try {
      throttleId = await client.acquireThrottle({ address: parseInt(address) });
      console.log(`\n✓ Throttle acquired: ${throttleId}`);
    } catch (error) {
      console.error('\n✗ THROTTLE ACQUISITION FAILED');
      console.error('Error:', error.message);
      console.error('\nPossible causes:');
      console.error('- Locomotive address does not exist in JMRI roster');
      console.error('- DCC system cannot find locomotive at that address');
      console.error('- Locomotive is already controlled by another throttle');
      console.error('- DCC command station error (check JMRI console for details)');
      throw error;
    }

    await confirm('Verify: Throttle acquired successfully');

    // If we got here, continue with rest of tests...
    console.log('\n✓ Throttle tests would continue from here');
    console.log('   Stopping test since we successfully acquired throttle.');

    // Release throttle
    console.log('\n→ Releasing throttle...');
    await client.releaseThrottle(throttleId);
    console.log('✓ Throttle released');

    // Power OFF
    console.log('\n→ Turning power OFF...');
    await client.powerOff();
    console.log('✓ Track power OFF');

    console.log('\n' + '='.repeat(70));
    console.log('✓ DEBUG TEST COMPLETED');
    console.log('='.repeat(70));

    await client.disconnect();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    await safeExit(1);
  }
}

// Start the test
runTest();
