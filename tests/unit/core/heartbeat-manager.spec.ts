import { HeartbeatManager } from '../../../src/core/heartbeat-manager';
import { HeartbeatOptions } from '../../../src/types/client-options';

describe('HeartbeatManager', () => {
  let heartbeatManager: HeartbeatManager;
  let sendPingMock: jest.Mock;

  const options: HeartbeatOptions = {
    enabled: true,
    interval: 100,
    timeout: 50
  };

  beforeAll(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllTimers();
    sendPingMock = jest.fn();
    heartbeatManager = new HeartbeatManager(options);
  });

  afterEach(() => {
    if (heartbeatManager) {
      heartbeatManager.stop();
    }
  });

  describe('start', () => {
    it('should not start if disabled', () => {
      const disabledOptions = { ...options, enabled: false };
      const manager = new HeartbeatManager(disabledOptions);

      manager.start(sendPingMock);
      jest.advanceTimersByTime(200);

      expect(sendPingMock).not.toHaveBeenCalled();
    });

    it('should not start if already running', () => {
      heartbeatManager.start(sendPingMock);
      heartbeatManager.start(sendPingMock);

      jest.advanceTimersByTime(options.interval);

      // Should only call once, not twice
      expect(sendPingMock).toHaveBeenCalledTimes(1);
    });

    it('should send ping at regular intervals', () => {
      heartbeatManager.start(sendPingMock);

      jest.advanceTimersByTime(options.interval);
      expect(sendPingMock).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(options.interval);
      expect(sendPingMock).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(options.interval);
      expect(sendPingMock).toHaveBeenCalledTimes(3);
    });

    it('should emit pingSent event when ping is sent', (done) => {
      heartbeatManager.on('pingSent', () => {
        done();
      });

      heartbeatManager.start(sendPingMock);
      jest.advanceTimersByTime(options.interval);
    });

    it('should emit timeout event when pong not received', (done) => {
      heartbeatManager.on('timeout', () => {
        done();
      });

      heartbeatManager.start(sendPingMock);
      jest.advanceTimersByTime(options.interval + options.timeout);
    });
  });

  describe('receivedPong', () => {
    it('should prevent timeout when pong received in time', () => {
      const timeoutMock = jest.fn();
      heartbeatManager.on('timeout', timeoutMock);

      heartbeatManager.start(sendPingMock);
      jest.advanceTimersByTime(options.interval);

      // Receive pong before timeout
      heartbeatManager.receivedPong();
      jest.advanceTimersByTime(options.timeout);

      expect(timeoutMock).not.toHaveBeenCalled();
    });

    it('should emit pongReceived event', (done) => {
      heartbeatManager.on('pongReceived', () => {
        done();
      });

      heartbeatManager.start(sendPingMock);
      jest.advanceTimersByTime(options.interval);
      heartbeatManager.receivedPong();
    });
  });

  describe('stop', () => {
    it('should stop sending pings', () => {
      heartbeatManager.start(sendPingMock);
      jest.advanceTimersByTime(options.interval);
      expect(sendPingMock).toHaveBeenCalledTimes(1);

      heartbeatManager.stop();
      jest.advanceTimersByTime(options.interval * 3);

      expect(sendPingMock).toHaveBeenCalledTimes(1); // No more calls
    });

    it('should clear pending timeout', () => {
      const timeoutMock = jest.fn();
      heartbeatManager.on('timeout', timeoutMock);

      heartbeatManager.start(sendPingMock);
      jest.advanceTimersByTime(options.interval);

      heartbeatManager.stop();
      jest.advanceTimersByTime(options.timeout);

      expect(timeoutMock).not.toHaveBeenCalled();
    });

    it('should update running status', () => {
      expect(heartbeatManager.running()).toBe(false);

      heartbeatManager.start(sendPingMock);
      expect(heartbeatManager.running()).toBe(true);

      heartbeatManager.stop();
      expect(heartbeatManager.running()).toBe(false);
    });
  });

  describe('updateOptions', () => {
    it('should update heartbeat options', () => {
      heartbeatManager.start(sendPingMock);
      heartbeatManager.stop();

      heartbeatManager.updateOptions({ interval: 200, timeout: 100 });

      heartbeatManager.start(sendPingMock);
      jest.advanceTimersByTime(100);
      expect(sendPingMock).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(sendPingMock).toHaveBeenCalledTimes(1);
    });
  });
});
