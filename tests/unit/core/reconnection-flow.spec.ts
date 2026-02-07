/**
 * Test the full reconnection flow to catch state transition bugs
 */

import { ConnectionStateManager } from '../../../src/core/connection-state-manager';
import { ConnectionState } from '../../../src/types/events';

describe('Reconnection Flow State Transitions', () => {
  let stateManager: ConnectionStateManager;

  beforeEach(() => {
    stateManager = new ConnectionStateManager();
  });

  it('should allow the full initial connection flow', () => {
    expect(stateManager.getState()).toBe(ConnectionState.DISCONNECTED);

    // Initial connection
    stateManager.transition(ConnectionState.CONNECTING);
    expect(stateManager.getState()).toBe(ConnectionState.CONNECTING);

    stateManager.transition(ConnectionState.CONNECTED);
    expect(stateManager.getState()).toBe(ConnectionState.CONNECTED);
  });

  it('should allow disconnection from connected state', () => {
    // Get to connected state
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);

    // Disconnect
    stateManager.transition(ConnectionState.DISCONNECTED);
    expect(stateManager.getState()).toBe(ConnectionState.DISCONNECTED);
  });

  it('should allow transition to reconnecting from connected', () => {
    // Get to connected state
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);

    // Connection drops, start reconnecting
    stateManager.transition(ConnectionState.RECONNECTING);
    expect(stateManager.getState()).toBe(ConnectionState.RECONNECTING);
  });

  it('should allow reconnection attempt from reconnecting state', () => {
    // Get to connected state
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);

    // Connection drops, start reconnecting
    stateManager.transition(ConnectionState.RECONNECTING);

    // THIS IS THE BUG: Reconnection attempt should be able to transition to CONNECTING
    // Without the fix, this throws: "Invalid state transition: reconnecting -> connecting"
    expect(() => {
      stateManager.transition(ConnectionState.CONNECTING);
    }).not.toThrow();

    expect(stateManager.getState()).toBe(ConnectionState.CONNECTING);
  });

  it('should handle failed reconnection attempt', () => {
    // Get to reconnecting state
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);
    stateManager.transition(ConnectionState.RECONNECTING);

    // Start reconnection attempt
    stateManager.transition(ConnectionState.CONNECTING);

    // Connection fails
    stateManager.transition(ConnectionState.DISCONNECTED);
    expect(stateManager.getState()).toBe(ConnectionState.DISCONNECTED);
  });

  it('should handle successful reconnection', () => {
    // Get to reconnecting state
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);
    stateManager.transition(ConnectionState.RECONNECTING);

    // Start reconnection attempt
    stateManager.transition(ConnectionState.CONNECTING);

    // Connection succeeds!
    stateManager.transition(ConnectionState.CONNECTED);
    expect(stateManager.getState()).toBe(ConnectionState.CONNECTED);
  });

  it('should allow multiple reconnection attempts', () => {
    // Get to connected, then reconnecting
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);
    stateManager.transition(ConnectionState.RECONNECTING);

    // Attempt 1 fails
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.DISCONNECTED);

    // Use forceState to get back to RECONNECTING (mimics what handleClose does)
    stateManager.forceState(ConnectionState.RECONNECTING);

    // Attempt 2 should work
    expect(() => {
      stateManager.transition(ConnectionState.CONNECTING);
    }).not.toThrow();

    // Attempt 2 fails too
    stateManager.transition(ConnectionState.DISCONNECTED);

    // Back to reconnecting
    stateManager.forceState(ConnectionState.RECONNECTING);

    // Attempt 3 succeeds
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);

    expect(stateManager.getState()).toBe(ConnectionState.CONNECTED);
  });

  it('should demonstrate the bug without the fix', () => {
    // This test documents what was happening with the bug

    // Create a state manager with the old VALID_TRANSITIONS
    // (This is just documentation - the actual fix is in place)

    // Simulate: connection succeeds, then drops
    stateManager.transition(ConnectionState.CONNECTING);
    stateManager.transition(ConnectionState.CONNECTED);

    // handleClose() calls forceState(RECONNECTING)
    stateManager.forceState(ConnectionState.RECONNECTING);

    // reconnectionManager calls connect()
    // connect() tries to transition(CONNECTING)
    // WITHOUT THE FIX: This would throw "Invalid state transition: reconnecting -> connecting"
    // WITH THE FIX: This succeeds

    expect(() => {
      stateManager.transition(ConnectionState.CONNECTING);
    }).not.toThrow();
  });
});
