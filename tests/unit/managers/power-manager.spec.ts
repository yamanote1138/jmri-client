import { PowerManager } from '../../../src/managers/power-manager';
import { WebSocketClient } from '../../../src/core/websocket-client';
import { PowerState, PowerMessage } from '../../../src/types/jmri-messages';
import { EventEmitter } from 'events';

jest.mock('../../../src/core/websocket-client');

describe('PowerManager', () => {
  let powerManager: PowerManager;
  let mockClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    mockClient = new EventEmitter() as any;
    mockClient.request = jest.fn();
    powerManager = new PowerManager(mockClient as any);
  });

  describe('getPower', () => {
    it('should request and return current power state', async () => {
      const response: PowerMessage = {
        type: 'power',
        data: { state: PowerState.ON }
      };

      mockClient.request.mockResolvedValue(response);

      const state = await powerManager.getPower();

      expect(state).toBe(PowerState.ON);
      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'power'
      });
    });

    it('should cache the power state', async () => {
      const response: PowerMessage = {
        type: 'power',
        data: { state: PowerState.OFF }
      };

      mockClient.request.mockResolvedValue(response);

      await powerManager.getPower();
      const cached = powerManager.getCachedState();

      expect(cached).toBe(PowerState.OFF);
    });
  });

  describe('setPower', () => {
    it('should set power state', async () => {
      mockClient.request.mockResolvedValue({});

      await powerManager.setPower(PowerState.ON);

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'power',
        method: 'post',
        data: { state: PowerState.ON }
      });
    });

    it('should update cached state', async () => {
      mockClient.request.mockResolvedValue({});

      await powerManager.setPower(PowerState.ON);

      expect(powerManager.getCachedState()).toBe(PowerState.ON);
    });

    it('should emit power:changed event when state changes', async () => {
      mockClient.request.mockResolvedValue({});

      const spy = jest.fn();
      powerManager.on('power:changed', spy);

      await powerManager.setPower(PowerState.ON);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(PowerState.ON);
    });

    it('should not emit power:changed event if state has not changed', async () => {
      mockClient.request.mockResolvedValue({});

      // Set initial state
      await powerManager.setPower(PowerState.ON);

      const spy = jest.fn();
      powerManager.on('power:changed', spy);

      // Set to same state
      await powerManager.setPower(PowerState.ON);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('powerOn', () => {
    it('should set power to ON', async () => {
      mockClient.request.mockResolvedValue({});

      await powerManager.powerOn();

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'power',
        method: 'post',
        data: { state: PowerState.ON }
      });
    });
  });

  describe('powerOff', () => {
    it('should set power to OFF', async () => {
      mockClient.request.mockResolvedValue({});

      await powerManager.powerOff();

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'power',
        method: 'post',
        data: { state: PowerState.OFF }
      });
    });
  });

  describe('power updates', () => {
    it('should handle unsolicited power updates from JMRI', (done) => {
      powerManager.on('power:changed', (state) => {
        expect(state).toBe(PowerState.ON);
        done();
      });

      const message: PowerMessage = {
        type: 'power',
        data: { state: PowerState.ON }
      };

      mockClient.emit('update', message);
    });

    it('should not emit event if state has not changed', () => {
      const spy = jest.fn();
      powerManager.on('power:changed', spy);

      // Set initial state
      const message1: PowerMessage = {
        type: 'power',
        data: { state: PowerState.ON }
      };
      mockClient.emit('update', message1);

      expect(spy).toHaveBeenCalledTimes(1);

      // Same state again
      mockClient.emit('update', message1);

      // Should not emit again
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit event when state changes', () => {
      const spy = jest.fn();
      powerManager.on('power:changed', spy);

      mockClient.emit('update', {
        type: 'power',
        data: { state: PowerState.ON }
      });

      mockClient.emit('update', {
        type: 'power',
        data: { state: PowerState.OFF }
      });

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, PowerState.ON);
      expect(spy).toHaveBeenNthCalledWith(2, PowerState.OFF);
    });
  });

  describe('getCachedState', () => {
    it('should return UNKNOWN initially', () => {
      expect(powerManager.getCachedState()).toBe(PowerState.UNKNOWN);
    });

    it('should return cached state after update', async () => {
      mockClient.request.mockResolvedValue({
        type: 'power',
        data: { state: PowerState.ON }
      });

      await powerManager.getPower();

      expect(powerManager.getCachedState()).toBe(PowerState.ON);
    });
  });

  describe('UNKNOWN state handling', () => {
    it('should handle getPower returning UNKNOWN', async () => {
      mockClient.request.mockResolvedValue({
        type: 'power',
        data: { state: PowerState.UNKNOWN }
      });

      const state = await powerManager.getPower();
      expect(state).toBe(PowerState.UNKNOWN);
    });

    it('should emit power:changed when transitioning to UNKNOWN', (done) => {
      mockClient.request.mockResolvedValue({
        type: 'power',
        data: { state: PowerState.ON }
      });

      powerManager.on('power:changed', (state) => {
        if (state === PowerState.UNKNOWN) {
          done();
        }
      });

      // Set to ON first
      powerManager.getPower().then(() => {
        // Then transition to UNKNOWN via unsolicited update
        (powerManager as any).handlePowerUpdate({
          type: 'power',
          data: { state: PowerState.UNKNOWN }
        });
      });
    });

    it('should emit power:changed when transitioning from UNKNOWN to ON', (done) => {
      powerManager.on('power:changed', (state) => {
        if (state === PowerState.ON) {
          done();
        }
      });

      // Starts as UNKNOWN, receive update to ON
      (powerManager as any).handlePowerUpdate({
        type: 'power',
        data: { state: PowerState.ON }
      });
    });
  });
});
