/**
 * Demo using mock mode (no JMRI server required)
 */

import { JmriClient } from '../dist/esm/index.js';

console.log('='.repeat(70));
console.log('JMRI CLIENT - MOCK MODE DEMO');
console.log('='.repeat(70));
console.log('\nThis demo uses mock responses - no JMRI server required!\n');

async function demo() {
  try {
    // Create client with mock mode enabled
    const client = new JmriClient({
      mock: {
        enabled: true,
        responseDelay: 100  // 100ms simulated network latency
      },
      autoConnect: true
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      client.on('connected', resolve);
      client.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    console.log('✓ Connected (mock mode)\n');

    // Test 1: Get roster
    console.log('[TEST 1] Get Roster');
    const roster = await client.getRoster();
    console.log(`✓ Found ${roster.length} locomotives:`);
    for (const entry of roster) {
      console.log(`  - ${entry.name}: ${entry.road} ${entry.model} (#${entry.address})`);
    }
    console.log();

    // Test 2: Power ON
    console.log('[TEST 2] Turn Power ON');
    await client.powerOn();
    const powerState = await client.getPower();
    console.log(`✓ Power state: ${powerState === 2 ? 'ON' : 'OFF'}`);
    console.log();

    // Test 3: Acquire throttle
    console.log('[TEST 3] Acquire Throttle');
    const throttleId = await client.acquireThrottle({ address: 754 });
    console.log(`✓ Throttle acquired: ${throttleId}`);
    console.log();

    // Test 4: Set speed
    console.log('[TEST 4] Set Speed to 50%');
    await client.setThrottleSpeed(throttleId, 0.5);
    const state = client.getThrottleState(throttleId);
    console.log(`✓ Current speed: ${(state.speed * 100).toFixed(0)}%`);
    console.log();

    // Test 5: Set direction
    console.log('[TEST 5] Set Direction to Reverse');
    await client.setThrottleDirection(throttleId, false);
    const state2 = client.getThrottleState(throttleId);
    console.log(`✓ Direction: ${state2.forward ? 'Forward' : 'Reverse'}`);
    console.log();

    // Test 6: Set function
    console.log('[TEST 6] Turn on Headlight (F0)');
    await client.setThrottleFunction(throttleId, 'F0', true);
    const state3 = client.getThrottleState(throttleId);
    console.log(`✓ Headlight: ${state3.functions.get('F0') ? 'ON' : 'OFF'}`);
    console.log();

    // Test 7: Release throttle
    console.log('[TEST 7] Release Throttle');
    await client.releaseThrottle(throttleId);
    console.log('✓ Throttle released');
    console.log();

    // Test 8: Power OFF
    console.log('[TEST 8] Turn Power OFF');
    await client.powerOff();
    const powerState2 = await client.getPower();
    console.log(`✓ Power state: ${powerState2 === 2 ? 'ON' : 'OFF'}`);
    console.log();

    // Disconnect
    await client.disconnect();

    console.log('='.repeat(70));
    console.log('✓ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

demo();
