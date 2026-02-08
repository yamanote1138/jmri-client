import { JmriClient, PowerState } from '../../src/index';

describe('Module exports', () => {
  it('should export JmriClient', () => {
    expect(JmriClient).toBeDefined();
    expect(typeof JmriClient).toBe('function');
  });

  it('should export PowerState', () => {
    expect(PowerState).toBeDefined();
    expect(PowerState.UNKNOWN).toBe(0);
    expect(PowerState.ON).toBe(2);
    expect(PowerState.OFF).toBe(4);
  });

  it('should export type utilities', () => {
    const { isThrottleFunctionKey, isValidSpeed, powerStateToString } = require('../../src/index');

    expect(typeof isThrottleFunctionKey).toBe('function');
    expect(typeof isValidSpeed).toBe('function');
    expect(typeof powerStateToString).toBe('function');
  });
});

describe('JmriClient v3 Constructor', () => {
  describe('when valid options are given', () => {
    it('should not throw an error with minimal options', () => {
      expect(() => {
        new JmriClient({ host: 'localhost', autoConnect: false });
      }).not.toThrow();
    });

    it('should not throw an error with full options', () => {
      expect(() => {
        new JmriClient({
          host: '192.168.1.138',
          port: 12080,
          autoConnect: false
        });
      }).not.toThrow();
    });

    it('should accept custom ports', () => {
      expect(() => {
        new JmriClient({
          host: '192.168.1.138',
          port: 8080,
          autoConnect: false
        });
      }).not.toThrow();
    });

    it('should use default options when not specified', () => {
      const client = new JmriClient({ autoConnect: false });
      expect(client).toBeInstanceOf(JmriClient);
    });
  });

  describe('configuration', () => {
    it('should accept reconnection options', () => {
      expect(() => {
        new JmriClient({
          host: 'localhost',
          autoConnect: false,
          reconnection: {
            enabled: false,
            maxAttempts: 5,
            initialDelay: 1000,
            maxDelay: 30000,
            multiplier: 2,
            jitter: true
          }
        });
      }).not.toThrow();
    });

    it('should accept heartbeat options', () => {
      expect(() => {
        new JmriClient({
          host: 'localhost',
          autoConnect: false,
          heartbeat: {
            enabled: false,
            interval: 10000,
            timeout: 5000
          }
        });
      }).not.toThrow();
    });

    it('should accept message queue size', () => {
      expect(() => {
        new JmriClient({
          host: 'localhost',
          autoConnect: false,
          messageQueueSize: 200
        });
      }).not.toThrow();
    });
  });

  describe('protocol option', () => {
    it('should accept ws protocol', () => {
      expect(() => {
        new JmriClient({
          host: 'localhost',
          protocol: 'ws',
          autoConnect: false
        });
      }).not.toThrow();
    });

    it('should accept wss protocol', () => {
      expect(() => {
        new JmriClient({
          host: 'localhost',
          protocol: 'wss',
          autoConnect: false
        });
      }).not.toThrow();
    });
  });
});
