#!/usr/bin/env node
/**
 * This script demonstrates the bug that existed in v3.1.1-3.1.5
 * by showing what happens when RECONNECTING cannot transition to CONNECTING
 */

import { ConnectionStateManager } from '../../dist/esm/core/connection-state-manager.js';
import { ConnectionState } from '../../dist/esm/types/events.js';

console.log('='.repeat(60));
console.log('DEMONSTRATING THE BUG (v3.1.1-3.1.5)');
console.log('='.repeat(60));
console.log();

// Create the BROKEN version of VALID_TRANSITIONS (what existed before the fix)
const BROKEN_VALID_TRANSITIONS = {
  [ConnectionState.DISCONNECTED]: [ConnectionState.CONNECTING],
  [ConnectionState.CONNECTING]: [ConnectionState.CONNECTED, ConnectionState.DISCONNECTED],
  [ConnectionState.CONNECTED]: [ConnectionState.DISCONNECTED, ConnectionState.RECONNECTING],
  // BUG: Missing ConnectionState.CONNECTING!
  [ConnectionState.RECONNECTING]: [ConnectionState.CONNECTED, ConnectionState.DISCONNECTED]
};

// Monkey-patch to test the old behavior
function createBrokenStateManager() {
  const stateManager = new ConnectionStateManager();
  const originalTransition = stateManager.transition.bind(stateManager);

  stateManager.transition = function(newState) {
    const currentState = this.getState();
    const validTransitions = BROKEN_VALID_TRANSITIONS[currentState];

    if (!validTransitions.includes(newState)) {
      throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
    }

    return originalTransition(newState);
  };

  return stateManager;
}

// Test with BROKEN version (simulating v3.1.1-3.1.5)
console.log('Testing with BROKEN state transitions (v3.1.1-3.1.5):');
console.log('-'.repeat(60));

const brokenManager = createBrokenStateManager();

try {
  console.log('1. Initial connection: DISCONNECTED → CONNECTING → CONNECTED');
  brokenManager.transition(ConnectionState.CONNECTING);
  brokenManager.transition(ConnectionState.CONNECTED);
  console.log('   ✓ Success\n');

  console.log('2. Connection drops, start reconnecting: CONNECTED → RECONNECTING');
  brokenManager.transition(ConnectionState.RECONNECTING);
  console.log('   ✓ Success\n');

  console.log('3. Reconnection attempt: RECONNECTING → CONNECTING');
  brokenManager.transition(ConnectionState.CONNECTING);
  console.log('   ✓ Success (this should not appear with the bug!)\n');

} catch (error) {
  console.log(`   ❌ FAILED: ${error.message}\n`);
  console.log('💥 THIS IS THE BUG!');
  console.log('');
  console.log('What happened in production:');
  console.log('  1. handleClose() set state to RECONNECTING');
  console.log('  2. ReconnectionManager called connect()');
  console.log('  3. connect() tried to transition(CONNECTING)');
  console.log('  4. State machine threw this error');
  console.log('  5. ReconnectionManager caught it (try/catch)');
  console.log('  6. Treated as connection failure');
  console.log('  7. Scheduled next attempt (infinite loop)');
  console.log('  8. No WebSocket ever created!');
  console.log('');
}

console.log('='.repeat(60));
console.log('TESTING THE FIX (v3.1.6)');
console.log('='.repeat(60));
console.log();

// Test with FIXED version (current code)
console.log('Testing with FIXED state transitions (v3.1.6):');
console.log('-'.repeat(60));

const fixedManager = new ConnectionStateManager();

try {
  console.log('1. Initial connection: DISCONNECTED → CONNECTING → CONNECTED');
  fixedManager.transition(ConnectionState.CONNECTING);
  fixedManager.transition(ConnectionState.CONNECTED);
  console.log('   ✓ Success\n');

  console.log('2. Connection drops, start reconnecting: CONNECTED → RECONNECTING');
  fixedManager.transition(ConnectionState.RECONNECTING);
  console.log('   ✓ Success\n');

  console.log('3. Reconnection attempt: RECONNECTING → CONNECTING');
  fixedManager.transition(ConnectionState.CONNECTING);
  console.log('   ✓ Success\n');

  console.log('4. Connection fails: CONNECTING → DISCONNECTED');
  fixedManager.transition(ConnectionState.DISCONNECTED);
  console.log('   ✓ Success\n');

  // Simulate another attempt
  fixedManager.forceState(ConnectionState.RECONNECTING);
  console.log('5. Second attempt: RECONNECTING → CONNECTING');
  fixedManager.transition(ConnectionState.CONNECTING);
  console.log('   ✓ Success\n');

  console.log('6. Connection succeeds: CONNECTING → CONNECTED');
  fixedManager.transition(ConnectionState.CONNECTED);
  console.log('   ✓ Success\n');

  console.log('✅ ALL TRANSITIONS WORK!');
  console.log('');
  console.log('With the fix:');
  console.log('  • Reconnection attempts can properly transition to CONNECTING');
  console.log('  • WebSocket connections are created on each attempt');
  console.log('  • Reconnection works as expected');
  console.log('');

} catch (error) {
  console.log(`   ❌ FAILED: ${error.message}\n`);
  console.log('This should not happen with the fix!');
  process.exit(1);
}

console.log('='.repeat(60));
