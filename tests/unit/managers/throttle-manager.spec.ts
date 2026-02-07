import { ThrottleManager } from '../../../src/managers/throttle-manager';
import { WebSocketClient } from '../../../src/core/websocket-client';
import { ThrottleMessage } from '../../../src/types/jmri-messages';
import { EventEmitter } from 'events';

jest.mock('../../../src/core/websocket-client');

describe('ThrottleManager', () => {
  let throttleManager: ThrottleManager;
  let mockClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    mockClient = new EventEmitter() as any;
    mockClient.request = jest.fn();
    mockClient.send = jest.fn();
    throttleManager = new ThrottleManager(mockClient as any);
  });

  describe('acquireThrottle', () => {
    it('should acquire throttle and return ID', async () => {
      const response: ThrottleMessage = {
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          address: 754
        }
      };

      mockClient.request.mockResolvedValue(response);

      const throttleId = await throttleManager.acquireThrottle({ address: 754 });

      expect(throttleId).toBe('CSX754');
      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'throttle',
        data: {
          address: 754,
          name: expect.stringContaining('jmri-client')
        }
      });
    });

    it('should initialize throttle state', async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });

      const throttleId = await throttleManager.acquireThrottle({ address: 754 });
      const state = throttleManager.getThrottleState(throttleId);

      expect(state).toBeDefined();
      expect(state?.id).toBe('CSX754');
      expect(state?.address).toBe(754);
      expect(state?.speed).toBe(0);
      expect(state?.forward).toBe(true);
      expect(state?.acquired).toBe(true);
    });

    it('should emit throttle:acquired event', (done) => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });

      throttleManager.on('throttle:acquired', (id) => {
        expect(id).toBe('CSX754');
        done();
      });

      throttleManager.acquireThrottle({ address: 754 });
    });

    it('should use generated ID if no throttle ID returned', async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { address: 754 }
      });

      const throttleId = await throttleManager.acquireThrottle({ address: 754 });

      // Should get a generated ID that includes the address
      expect(throttleId).toContain('754');
      expect(throttleId).toContain('jmri-client');
    });
  });

  describe('releaseThrottle', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should release throttle', async () => {
      mockClient.request.mockResolvedValue({});

      await throttleManager.releaseThrottle('CSX754');

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          release: null
        }
      });
    });

    it('should remove throttle from tracking', async () => {
      mockClient.request.mockResolvedValue({});

      await throttleManager.releaseThrottle('CSX754');

      const state = throttleManager.getThrottleState('CSX754');
      expect(state).toBeUndefined();
    });

    it('should emit throttle:released event', (done) => {
      mockClient.request.mockResolvedValue({});

      throttleManager.on('throttle:released', (id) => {
        expect(id).toBe('CSX754');
        done();
      });

      throttleManager.releaseThrottle('CSX754');
    });

    it('should throw error for non-existent throttle', async () => {
      await expect(
        throttleManager.releaseThrottle('NonExistent')
      ).rejects.toThrow('Throttle not found');
    });
  });

  describe('setSpeed', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should set throttle speed', async () => {
      await throttleManager.setSpeed('CSX754', 0.5);

      expect(mockClient.send).toHaveBeenCalledWith({
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          speed: 0.5
        }
      });
    });

    it('should update throttle state', async () => {
      await throttleManager.setSpeed('CSX754', 0.75);

      const state = throttleManager.getThrottleState('CSX754');
      expect(state?.speed).toBe(0.75);
    });

    it('should throw error for invalid speed', async () => {
      await expect(
        throttleManager.setSpeed('CSX754', -0.1)
      ).rejects.toThrow('Invalid speed');

      await expect(
        throttleManager.setSpeed('CSX754', 1.5)
      ).rejects.toThrow('Invalid speed');
    });

    it('should throw error for non-existent throttle', async () => {
      await expect(
        throttleManager.setSpeed('NonExistent', 0.5)
      ).rejects.toThrow('Throttle not found');
    });
  });

  describe('setDirection', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should set throttle direction forward', async () => {
      await throttleManager.setDirection('CSX754', true);

      expect(mockClient.send).toHaveBeenCalledWith({
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          forward: true
        }
      });
    });

    it('should set throttle direction reverse', async () => {
      await throttleManager.setDirection('CSX754', false);

      const state = throttleManager.getThrottleState('CSX754');
      expect(state?.forward).toBe(false);
    });

    it('should throw error for non-existent throttle', async () => {
      await expect(
        throttleManager.setDirection('NonExistent', true)
      ).rejects.toThrow('Throttle not found');
    });
  });

  describe('setFunction', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should set throttle function', async () => {
      await throttleManager.setFunction('CSX754', 'F0', true);

      expect(mockClient.send).toHaveBeenCalledWith({
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          F0: true
        }
      });
    });

    it('should update throttle state', async () => {
      await throttleManager.setFunction('CSX754', 'F2', true);

      const state = throttleManager.getThrottleState('CSX754');
      expect(state?.functions.get('F2')).toBe(true);
    });

    it('should support all function keys F0-F28', async () => {
      await throttleManager.setFunction('CSX754', 'F0', true);
      await throttleManager.setFunction('CSX754', 'F28', true);

      const state = throttleManager.getThrottleState('CSX754');
      expect(state?.functions.get('F0')).toBe(true);
      expect(state?.functions.get('F28')).toBe(true);
    });

    it('should throw error for invalid function key', async () => {
      await expect(
        throttleManager.setFunction('CSX754', 'F29' as any, true)
      ).rejects.toThrow('Invalid function key');
    });

    it('should throw error for non-existent throttle', async () => {
      await expect(
        throttleManager.setFunction('NonExistent', 'F0', true)
      ).rejects.toThrow('Throttle not found');
    });
  });

  describe('emergencyStop', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should set speed to 0', async () => {
      await throttleManager.emergencyStop('CSX754');

      expect(mockClient.send).toHaveBeenCalledWith({
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          speed: 0
        }
      });
    });
  });

  describe('idle', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should set speed to 0', async () => {
      await throttleManager.idle('CSX754');

      const state = throttleManager.getThrottleState('CSX754');
      expect(state?.speed).toBe(0);
    });
  });

  describe('getThrottleIds', () => {
    it('should return all throttle IDs', async () => {
      mockClient.request.mockResolvedValueOnce({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      }).mockResolvedValueOnce({
        type: 'throttle',
        data: { throttle: 'UP3985', address: 3985 }
      });

      await throttleManager.acquireThrottle({ address: 754 });
      await throttleManager.acquireThrottle({ address: 3985 });

      const ids = throttleManager.getThrottleIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain('CSX754');
      expect(ids).toContain('UP3985');
    });
  });

  describe('getAllThrottles', () => {
    it('should return all throttle states', async () => {
      mockClient.request.mockResolvedValueOnce({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      }).mockResolvedValueOnce({
        type: 'throttle',
        data: { throttle: 'UP3985', address: 3985 }
      });

      await throttleManager.acquireThrottle({ address: 754 });
      await throttleManager.acquireThrottle({ address: 3985 });

      const throttles = throttleManager.getAllThrottles();

      expect(throttles).toHaveLength(2);
    });
  });

  describe('releaseAllThrottles', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });

      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'UP3985', address: 3985 }
      });
      await throttleManager.acquireThrottle({ address: 3985 });
    });

    it('should release all throttles', async () => {
      mockClient.request.mockResolvedValue({});

      await throttleManager.releaseAllThrottles();

      expect(throttleManager.getThrottleIds()).toHaveLength(0);
    });

    it('should continue on error', async () => {
      mockClient.request.mockClear();

      mockClient.request
        .mockRejectedValueOnce(new Error('Release failed'))
        .mockResolvedValueOnce({});

      // Listen for error event to prevent unhandled error
      const errorSpy = jest.fn();
      throttleManager.on('error', errorSpy);

      await throttleManager.releaseAllThrottles();

      // Should still try to release both (2 throttles acquired in beforeEach)
      expect(mockClient.request).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('throttle updates', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should handle unsolicited throttle updates', (done) => {
      throttleManager.on('throttle:updated', (id, data) => {
        expect(id).toBe('CSX754');
        expect(data.speed).toBe(0.5);
        done();
      });

      const message: ThrottleMessage = {
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          speed: 0.5
        }
      };

      mockClient.emit('update', message);
    });

    it('should update throttle state from unsolicited updates', () => {
      const message: ThrottleMessage = {
        type: 'throttle',
        data: {
          throttle: 'CSX754',
          speed: 0.75,
          forward: false,
          F0: true
        }
      };

      mockClient.emit('update', message);

      const state = throttleManager.getThrottleState('CSX754');
      expect(state?.speed).toBe(0.75);
      expect(state?.forward).toBe(false);
      expect(state?.functions.get('F0')).toBe(true);
    });

    it('should emit throttle:lost for unknown throttle', (done) => {
      throttleManager.on('throttle:lost', (id) => {
        expect(id).toBe('UnknownThrottle');
        done();
      });

      const message: ThrottleMessage = {
        type: 'throttle',
        data: {
          throttle: 'UnknownThrottle',
          speed: 0.5
        }
      };

      mockClient.emit('update', message);
    });
  });

  describe('disconnect handling', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'throttle',
        data: { throttle: 'CSX754', address: 754 }
      });
      await throttleManager.acquireThrottle({ address: 754 });
    });

    it('should mark throttles as not acquired on disconnect', () => {
      mockClient.emit('disconnected');

      const state = throttleManager.getThrottleState('CSX754');
      expect(state?.acquired).toBe(false);
    });
  });
});
