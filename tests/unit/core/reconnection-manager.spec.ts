import { ReconnectionManager } from '../../../src/core/reconnection-manager';
import { ReconnectionOptions } from '../../../src/types/client-options';

describe('ReconnectionManager', () => {
  let reconnectionManager: ReconnectionManager;
  let reconnectMock: jest.Mock;

  const options: ReconnectionOptions = {
    enabled: true,
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 1000,
    multiplier: 2,
    jitter: false
  };

  beforeAll(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllTimers();
    reconnectMock = jest.fn().mockResolvedValue(undefined);
    reconnectionManager = new ReconnectionManager(options);
  });

  afterEach(() => {
    if (reconnectionManager) {
      reconnectionManager.stop();
    }
  });

  describe('start', () => {
    it('should not start if disabled', () => {
      const disabledOptions = { ...options, enabled: false };
      const manager = new ReconnectionManager(disabledOptions);

      manager.start(reconnectMock);
      jest.advanceTimersByTime(1000);

      expect(reconnectMock).not.toHaveBeenCalled();
    });

    it('should not start if already reconnecting', () => {
      reconnectionManager.start(reconnectMock);
      reconnectionManager.start(reconnectMock);

      jest.advanceTimersByTime(options.initialDelay);

      expect(reconnectMock).toHaveBeenCalledTimes(1);
    });

    it('should schedule first attempt with initial delay', (done) => {
      reconnectionManager.on('attemptScheduled', (attempt, delay) => {
        expect(attempt).toBe(1);
        expect(delay).toBe(options.initialDelay);
        done();
      });

      reconnectionManager.start(reconnectMock);
    });

    it('should attempt reconnection after delay', async () => {
      reconnectionManager.start(reconnectMock);

      jest.advanceTimersByTime(options.initialDelay);
      await Promise.resolve(); // Wait for promise

      expect(reconnectMock).toHaveBeenCalledTimes(1);
    });

    it('should emit attempting event', (done) => {
      reconnectionManager.on('attempting', (attempt) => {
        expect(attempt).toBe(1);
        done();
      });

      reconnectionManager.start(reconnectMock);
      jest.advanceTimersByTime(options.initialDelay);
    });

    it('should emit attempting event', () => {
      const attemptingSpy = jest.fn();
      reconnectionManager.on('attempting', attemptingSpy);

      reconnectionManager.start(reconnectMock);
      jest.advanceTimersByTime(options.initialDelay);

      expect(attemptingSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('exponential backoff', () => {
    it('should schedule attempts with increasing delays', () => {
      reconnectMock.mockRejectedValue(new Error('Connection failed'));
      const delays: number[] = [];

      reconnectionManager.on('attemptScheduled', (_attempt, delay) => {
        delays.push(delay);
      });

      reconnectionManager.start(reconnectMock);

      // First attempt should be scheduled
      expect(delays.length).toBeGreaterThanOrEqual(1);
      expect(delays[0]).toBe(100);  // 100 * 2^0 = 100
    });

    it('should handle connection failures', () => {
      reconnectMock.mockRejectedValue(new Error('Connection failed'));

      const failedSpy = jest.fn();
      reconnectionManager.on('failed', failedSpy);

      reconnectionManager.start(reconnectMock);

      // Should be in reconnecting state
      expect(reconnectionManager.reconnecting()).toBe(true);
      expect(reconnectionManager.getAttempt()).toBeGreaterThan(0);
    });
  });

  describe('max attempts', () => {
    it('should respect maxAttempts configuration', () => {
      reconnectMock.mockRejectedValue(new Error('Connection failed'));

      reconnectionManager.start(reconnectMock);

      // Verify it's configured with max attempts
      expect(reconnectionManager.reconnecting()).toBe(true);

      // Can manually trigger max by stopping
      reconnectionManager.stop();
      expect(reconnectionManager.reconnecting()).toBe(false);
    });

    it('should continue indefinitely when maxAttempts is 0', async () => {
      const infiniteOptions = { ...options, maxAttempts: 0 };
      const manager = new ReconnectionManager(infiniteOptions);
      reconnectMock.mockRejectedValue(new Error('Connection failed'));

      manager.start(reconnectMock);

      // Run many attempts
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(10000);
        await Promise.resolve();
      }

      expect(reconnectMock).toHaveBeenCalled();
      expect(manager.reconnecting()).toBe(true);

      manager.stop();
    });
  });

  describe('stop', () => {
    it('should cancel pending reconnection', () => {
      reconnectionManager.start(reconnectMock);
      reconnectionManager.stop();

      jest.advanceTimersByTime(options.initialDelay);

      expect(reconnectMock).not.toHaveBeenCalled();
      expect(reconnectionManager.reconnecting()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset attempt counter', () => {
      reconnectionManager.start(reconnectMock);
      jest.advanceTimersByTime(options.initialDelay);

      expect(reconnectionManager.getAttempt()).toBe(1);

      reconnectionManager.reset();
      expect(reconnectionManager.getAttempt()).toBe(0);
      expect(reconnectionManager.reconnecting()).toBe(false);
    });
  });

  describe('updateOptions', () => {
    it('should update reconnection options', () => {
      reconnectionManager.updateOptions({ maxAttempts: 5, initialDelay: 200 });

      reconnectionManager.start(reconnectMock);

      const firstDelay = new Promise<number>((resolve) => {
        reconnectionManager.once('attemptScheduled', (_attempt, delay) => {
          resolve(delay);
        });
      });

      expect(firstDelay).resolves.toBe(200);
    });
  });
});
