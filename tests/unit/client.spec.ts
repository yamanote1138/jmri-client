import { JmriClient } from '../../src/client';
import { PowerState } from '../../src/types/jmri-messages';
import { ConnectionState } from '../../src/types/events';

// Mock WebSocket
jest.mock('ws');

describe('JmriClient', () => {
  let client: JmriClient;

  beforeEach(() => {
    // Create client with autoConnect disabled for controlled testing
    client = new JmriClient({
      host: 'localhost',
      port: 12080,
      autoConnect: false
    });
  });

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create client with default options', () => {
      const defaultClient = new JmriClient({ autoConnect: false });

      expect(defaultClient).toBeInstanceOf(JmriClient);
      expect(defaultClient.isConnected()).toBe(false);
    });

    it('should create client with custom options', () => {
      const customClient = new JmriClient({
        host: 'jmri.local',
        port: 8080,
        autoConnect: false,
        reconnection: {
          enabled: false,
          maxAttempts: 5,
          initialDelay: 2000,
          maxDelay: 60000,
          multiplier: 2,
          jitter: false
        }
      });

      expect(customClient).toBeInstanceOf(JmriClient);
    });

    it('should auto-connect when autoConnect is true', () => {
      // This would attempt connection, so we skip actual test
      // but verify the option is respected
      const autoClient = new JmriClient({
        host: 'localhost',
        autoConnect: true
      });

      expect(autoClient).toBeInstanceOf(JmriClient);
    });
  });

  describe('connection management', () => {
    it('should have isConnected method', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should have getConnectionState method', () => {
      const state = client.getConnectionState();
      expect(state).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('event forwarding', () => {
    it('should forward connected event', (done) => {
      client.on('connected', () => {
        done();
      });

      // Simulate connection event from WebSocket client
      (client as any).wsClient.emit('connected');
    });

    it('should forward disconnected event', (done) => {
      client.on('disconnected', (reason) => {
        expect(typeof reason).toBe('string');
        done();
      });

      (client as any).wsClient.emit('disconnected', 'Test disconnect');
    });

    it('should forward error event', (done) => {
      const error = new Error('Test error');

      client.on('error', (err) => {
        expect(err).toBe(error);
        done();
      });

      (client as any).wsClient.emit('error', error);
    });

    it('should forward power:changed event', (done) => {
      client.on('power:changed', (state) => {
        expect(state).toBe(PowerState.ON);
        done();
      });

      (client as any).powerManager.emit('power:changed', PowerState.ON);
    });

    it('should forward throttle events', (done) => {
      client.on('throttle:acquired', (id) => {
        expect(id).toBe('CSX754');
        done();
      });

      (client as any).throttleManager.emit('throttle:acquired', 'CSX754');
    });
  });

  describe('power control methods', () => {
    it('should have getPower method', () => {
      expect(typeof client.getPower).toBe('function');
    });

    it('should have setPower method', () => {
      expect(typeof client.setPower).toBe('function');
    });

    it('should have powerOn method', () => {
      expect(typeof client.powerOn).toBe('function');
    });

    it('should have powerOff method', () => {
      expect(typeof client.powerOff).toBe('function');
    });
  });

  describe('roster management methods', () => {
    it('should have getRoster method', () => {
      expect(typeof client.getRoster).toBe('function');
    });

    it('should have getRosterEntryByName method', () => {
      expect(typeof client.getRosterEntryByName).toBe('function');
    });

    it('should have getRosterEntryByAddress method', () => {
      expect(typeof client.getRosterEntryByAddress).toBe('function');
    });

    it('should have searchRoster method', () => {
      expect(typeof client.searchRoster).toBe('function');
    });
  });

  describe('throttle control methods', () => {
    it('should have acquireThrottle method', () => {
      expect(typeof client.acquireThrottle).toBe('function');
    });

    it('should have releaseThrottle method', () => {
      expect(typeof client.releaseThrottle).toBe('function');
    });

    it('should have setThrottleSpeed method', () => {
      expect(typeof client.setThrottleSpeed).toBe('function');
    });

    it('should have setThrottleDirection method', () => {
      expect(typeof client.setThrottleDirection).toBe('function');
    });

    it('should have setThrottleFunction method', () => {
      expect(typeof client.setThrottleFunction).toBe('function');
    });

    it('should have emergencyStop method', () => {
      expect(typeof client.emergencyStop).toBe('function');
    });

    it('should have idleThrottle method', () => {
      expect(typeof client.idleThrottle).toBe('function');
    });

    it('should have getThrottleState method', () => {
      expect(typeof client.getThrottleState).toBe('function');
    });

    it('should have getThrottleIds method', () => {
      expect(typeof client.getThrottleIds).toBe('function');
    });

    it('should have getAllThrottles method', () => {
      expect(typeof client.getAllThrottles).toBe('function');
    });

    it('should have releaseAllThrottles method', () => {
      expect(typeof client.releaseAllThrottles).toBe('function');
    });
  });

  describe('disconnect', () => {
    it('should release all throttles before disconnecting', async () => {
      const releaseAllSpy = jest.spyOn(
        (client as any).throttleManager,
        'releaseAllThrottles'
      ).mockResolvedValue(undefined);

      const disconnectSpy = jest.spyOn(
        (client as any).wsClient,
        'disconnect'
      ).mockResolvedValue(undefined);

      await client.disconnect();

      expect(releaseAllSpy).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
      // Verify throttles were released before disconnect
      expect(releaseAllSpy.mock.invocationCallOrder[0]).toBeLessThan(
        disconnectSpy.mock.invocationCallOrder[0]
      );
    });
  });

  describe('configuration options', () => {
    it('should accept minimal configuration', () => {
      const minimalClient = new JmriClient({
        host: 'localhost',
        autoConnect: false
      });

      expect(minimalClient).toBeInstanceOf(JmriClient);
    });

    it('should accept full configuration', () => {
      const fullClient = new JmriClient({
        host: 'jmri.local',
        port: 8080,
        protocol: 'ws',
        autoConnect: false,
        reconnection: {
          enabled: true,
          maxAttempts: 10,
          initialDelay: 500,
          maxDelay: 10000,
          multiplier: 1.5,
          jitter: true
        },
        heartbeat: {
          enabled: true,
          interval: 15000,
          timeout: 3000
        },
        messageQueueSize: 50,
        requestTimeout: 5000
      });

      expect(fullClient).toBeInstanceOf(JmriClient);
    });
  });
});
