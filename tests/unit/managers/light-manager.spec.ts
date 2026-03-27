import { LightManager } from '../../../src/managers/light-manager';
import { WebSocketClient } from '../../../src/core/websocket-client';
import { LightState, LightMessage } from '../../../src/types/jmri-messages';
import { EventEmitter } from 'events';

jest.mock('../../../src/core/websocket-client');

describe('LightManager', () => {
  let lightManager: LightManager;
  let mockClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    mockClient = new EventEmitter() as any;
    mockClient.request = jest.fn();
    lightManager = new LightManager(mockClient as any);
  });

  describe('getLight', () => {
    it('should request and return the current state', async () => {
      const response: LightMessage = {
        type: 'light',
        data: { name: 'IL1', state: LightState.ON }
      };

      mockClient.request.mockResolvedValue(response);

      const state = await lightManager.getLight('IL1');

      expect(state).toBe(LightState.ON);
      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'light',
        data: { name: 'IL1' }
      });
    });

    it('should cache the light state', async () => {
      mockClient.request.mockResolvedValue({
        type: 'light',
        data: { name: 'IL1', state: LightState.OFF }
      });

      await lightManager.getLight('IL1');

      expect(lightManager.getLightState('IL1')).toBe(LightState.OFF);
    });

    it('should return UNKNOWN when response has no state', async () => {
      mockClient.request.mockResolvedValue({ type: 'light', data: { name: 'IL1' } });

      const state = await lightManager.getLight('IL1');

      expect(state).toBe(LightState.UNKNOWN);
    });
  });

  describe('setLight', () => {
    it('should send a post request with the given state', async () => {
      mockClient.request.mockResolvedValue({});

      await lightManager.setLight('IL1', LightState.ON);

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'light',
        method: 'post',
        data: { name: 'IL1', state: LightState.ON }
      });
    });

    it('should update the cached state', async () => {
      mockClient.request.mockResolvedValue({});

      await lightManager.setLight('IL1', LightState.ON);

      expect(lightManager.getLightState('IL1')).toBe(LightState.ON);
    });

    it('should emit light:changed when state changes', async () => {
      mockClient.request.mockResolvedValue({});

      const spy = jest.fn();
      lightManager.on('light:changed', spy);

      await lightManager.setLight('IL1', LightState.ON);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('IL1', LightState.ON);
    });

    it('should not emit light:changed when state has not changed', async () => {
      mockClient.request.mockResolvedValue({});

      await lightManager.setLight('IL1', LightState.ON);

      const spy = jest.fn();
      lightManager.on('light:changed', spy);

      await lightManager.setLight('IL1', LightState.ON);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('turnOnLight', () => {
    it('should set state to ON', async () => {
      mockClient.request.mockResolvedValue({});

      await lightManager.turnOnLight('IL1');

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'light',
        method: 'post',
        data: { name: 'IL1', state: LightState.ON }
      });
    });
  });

  describe('turnOffLight', () => {
    it('should set state to OFF', async () => {
      mockClient.request.mockResolvedValue({});

      await lightManager.turnOffLight('IL1');

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'light',
        method: 'post',
        data: { name: 'IL1', state: LightState.OFF }
      });
    });
  });

  describe('listLights', () => {
    it('should request a list of all lights', async () => {
      mockClient.request.mockResolvedValue({
        type: 'light',
        data: [
          { type: 'light', data: { name: 'IL1', state: LightState.OFF } },
          { type: 'light', data: { name: 'IL2', state: LightState.ON } }
        ],
        id: 1
      });

      const lights = await lightManager.listLights();

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'light',
        method: 'list'
      });
      expect(lights).toHaveLength(2);
      expect(lights[0].name).toBe('IL1');
      expect(lights[1].name).toBe('IL2');
    });

    it('should cache states from the list response', async () => {
      mockClient.request.mockResolvedValue({
        type: 'light',
        data: [
          { type: 'light', data: { name: 'IL1', state: LightState.OFF } },
          { type: 'light', data: { name: 'IL2', state: LightState.ON } }
        ],
        id: 1
      });

      await lightManager.listLights();

      expect(lightManager.getLightState('IL1')).toBe(LightState.OFF);
      expect(lightManager.getLightState('IL2')).toBe(LightState.ON);
    });

    it('should return empty array for non-array response', async () => {
      mockClient.request.mockResolvedValue({ type: 'light', data: {} });

      const lights = await lightManager.listLights();

      expect(lights).toEqual([]);
    });
  });

  describe('getLightState', () => {
    it('should return undefined for unknown lights', () => {
      expect(lightManager.getLightState('UNKNOWN_LIGHT')).toBeUndefined();
    });
  });

  describe('getCachedLights', () => {
    it('should return a copy of all cached states', async () => {
      mockClient.request.mockResolvedValue({});

      await lightManager.setLight('IL1', LightState.OFF);
      await lightManager.setLight('IL2', LightState.ON);

      const cached = lightManager.getCachedLights();

      expect(cached.size).toBe(2);
      expect(cached.get('IL1')).toBe(LightState.OFF);
      expect(cached.get('IL2')).toBe(LightState.ON);
    });

    it('should return a copy, not a reference to internal state', async () => {
      mockClient.request.mockResolvedValue({});

      await lightManager.setLight('IL1', LightState.OFF);
      const cached = lightManager.getCachedLights();
      cached.set('IL1', LightState.ON);

      expect(lightManager.getLightState('IL1')).toBe(LightState.OFF);
    });
  });

  describe('unsolicited server updates', () => {
    it('should handle a server-pushed light update', (done) => {
      lightManager.on('light:changed', (name, state) => {
        expect(name).toBe('IL1');
        expect(state).toBe(LightState.ON);
        done();
      });

      mockClient.emit('update', {
        type: 'light',
        data: { name: 'IL1', state: LightState.ON }
      });
    });

    it('should update the cache from server push', () => {
      mockClient.emit('update', {
        type: 'light',
        data: { name: 'IL1', state: LightState.OFF }
      });

      expect(lightManager.getLightState('IL1')).toBe(LightState.OFF);
    });

    it('should not emit event if state has not changed', () => {
      const spy = jest.fn();
      lightManager.on('light:changed', spy);

      mockClient.emit('update', { type: 'light', data: { name: 'IL1', state: LightState.OFF } });
      mockClient.emit('update', { type: 'light', data: { name: 'IL1', state: LightState.OFF } });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should ignore updates with no name', () => {
      const spy = jest.fn();
      lightManager.on('light:changed', spy);

      mockClient.emit('update', { type: 'light', data: { state: LightState.OFF } });

      expect(spy).not.toHaveBeenCalled();
    });

    it('should ignore non-light updates', () => {
      const spy = jest.fn();
      lightManager.on('light:changed', spy);

      mockClient.emit('update', { type: 'power', data: { state: 2 } });

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
