import { ConnectionStateManager } from '../../../src/core/connection-state-manager';
import { ConnectionState } from '../../../src/types/events';

describe('ConnectionStateManager', () => {
  let stateManager: ConnectionStateManager;

  beforeEach(() => {
    stateManager = new ConnectionStateManager();
  });

  describe('initial state', () => {
    it('should start in DISCONNECTED state', () => {
      expect(stateManager.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(stateManager.isDisconnected()).toBe(true);
      expect(stateManager.isConnected()).toBe(false);
      expect(stateManager.isConnecting()).toBe(false);
      expect(stateManager.isReconnecting()).toBe(false);
    });
  });

  describe('transition', () => {
    it('should transition from DISCONNECTED to CONNECTING', () => {
      stateManager.transition(ConnectionState.CONNECTING);
      expect(stateManager.getState()).toBe(ConnectionState.CONNECTING);
      expect(stateManager.isConnecting()).toBe(true);
    });

    it('should transition from CONNECTING to CONNECTED', () => {
      stateManager.transition(ConnectionState.CONNECTING);
      stateManager.transition(ConnectionState.CONNECTED);
      expect(stateManager.getState()).toBe(ConnectionState.CONNECTED);
      expect(stateManager.isConnected()).toBe(true);
    });

    it('should transition from CONNECTED to DISCONNECTED', () => {
      stateManager.transition(ConnectionState.CONNECTING);
      stateManager.transition(ConnectionState.CONNECTED);
      stateManager.transition(ConnectionState.DISCONNECTED);
      expect(stateManager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should transition from CONNECTED to RECONNECTING', () => {
      stateManager.transition(ConnectionState.CONNECTING);
      stateManager.transition(ConnectionState.CONNECTED);
      stateManager.transition(ConnectionState.RECONNECTING);
      expect(stateManager.getState()).toBe(ConnectionState.RECONNECTING);
      expect(stateManager.isReconnecting()).toBe(true);
    });

    it('should emit stateChanged event on transition', (done) => {
      stateManager.on('stateChanged', (newState, prevState) => {
        expect(newState).toBe(ConnectionState.CONNECTING);
        expect(prevState).toBe(ConnectionState.DISCONNECTED);
        done();
      });

      stateManager.transition(ConnectionState.CONNECTING);
    });

    it('should throw error for invalid transition', () => {
      expect(() => {
        stateManager.transition(ConnectionState.CONNECTED);
      }).toThrow('Invalid state transition');
    });

    it('should throw error when transitioning from DISCONNECTED to RECONNECTING', () => {
      expect(() => {
        stateManager.transition(ConnectionState.RECONNECTING);
      }).toThrow('Invalid state transition');
    });
  });

  describe('forceState', () => {
    it('should allow any state transition', () => {
      stateManager.forceState(ConnectionState.CONNECTED);
      expect(stateManager.getState()).toBe(ConnectionState.CONNECTED);

      stateManager.forceState(ConnectionState.RECONNECTING);
      expect(stateManager.getState()).toBe(ConnectionState.RECONNECTING);
    });

    it('should emit stateChanged event', (done) => {
      stateManager.on('stateChanged', (newState, prevState) => {
        expect(newState).toBe(ConnectionState.CONNECTED);
        expect(prevState).toBe(ConnectionState.DISCONNECTED);
        done();
      });

      stateManager.forceState(ConnectionState.CONNECTED);
    });
  });

  describe('reset', () => {
    it('should reset to DISCONNECTED state', () => {
      stateManager.transition(ConnectionState.CONNECTING);
      stateManager.transition(ConnectionState.CONNECTED);

      stateManager.reset();
      expect(stateManager.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });
});
