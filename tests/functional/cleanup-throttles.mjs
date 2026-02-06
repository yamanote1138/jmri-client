import { JmriClient } from "../../dist/esm/index.js";
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question, defaultValue) {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function cleanup() {
  console.log('='.repeat(70));
  console.log('JMRI THROTTLE CLEANUP UTILITY');
  console.log('='.repeat(70));
  console.log('\nThis utility will:');
  console.log('1. Connect to JMRI');
  console.log('2. Release any throttles from this client');
  console.log('3. Turn power OFF');
  console.log('4. Disconnect\n');

  try {
    const host = await ask('JMRI hostname or IP', 'raspi-jmri.local');
    const port = await ask('JMRI port', '12080');

    console.log(`\n→ Connecting to ${host}:${port}...`);

    const client = new JmriClient({
      host: host,
      port: parseInt(port),
      autoConnect: true
    });

    await new Promise((resolve, reject) => {
      client.on('connected', resolve);
      client.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    console.log('✓ Connected');

    // Release all throttles (if any exist in this client)
    console.log('\n→ Releasing any active throttles...');
    try {
      await client.releaseAllThrottles();
      console.log('✓ All throttles released');
    } catch (error) {
      console.log('✓ No active throttles to release');
    }

    // Turn power off
    console.log('\n→ Turning power OFF...');
    await client.powerOff();
    console.log('✓ Power OFF');

    console.log('\n' + '='.repeat(70));
    console.log('✓ CLEANUP COMPLETE');
    console.log('='.repeat(70));
    console.log('\nNote: This only releases throttles created by this client.');
    console.log('To clear ALL throttles in JMRI, use: Tools → Throttles → Release All');
    console.log('Or restart JMRI to clear everything.\n');

    await client.disconnect();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

cleanup();
