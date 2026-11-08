import { SensorManager } from '../../../src/managers/sensor-manager';
import { WebSocketClient } from '../../../src/core/websocket-client';
import { SensorState, SensorMessage } from '../../../src/types/jmri-messages';
import { EventEmitter } from 'events';

jest.mock('../../../src/core/websocket-client');

describe('SensorManager', () => {
  let sensorManager: SensorManager;
  let mockClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    mockClient = new EventEmitter() as any;
    mockClient.request = jest.fn();
    sensorManager = new SensorManager(mockClient as any);
  });

  describe('getSensor', () => {
    it('should request and return the current state', async () => {
      const response: SensorMessage = {
        type: 'sensor',
        data: { name: 'IS1', state: SensorState.ACTIVE }
      };

      mockClient.request.mockResolvedValue(response);

      const state = await sensorManager.getSensor('IS1');

      expect(state).toBe(SensorState.ACTIVE);
      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'sensor',
        data: { name: 'IS1' }
      });
    });

    it('should cache the sensor state', async () => {
      mockClient.request.mockResolvedValue({
        type: 'sensor',
        data: { name: 'IS1', state: SensorState.INACTIVE }
      });

      await sensorManager.getSensor('IS1');

      expect(sensorManager.getSensorState('IS1')).toBe(SensorState.INACTIVE);
    });

    it('should return INCONSISTENT when the server reports it', async () => {
      mockClient.request.mockResolvedValue({
        type: 'sensor',
        data: { name: 'IS1', state: SensorState.INCONSISTENT }
      });

      const state = await sensorManager.getSensor('IS1');

      expect(state).toBe(SensorState.INCONSISTENT);
    });

    it('should cache under the system name JMRI replies with when given a user name', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS1', userName: 'Block 1', state: SensorState.ACTIVE } });

      const state = await sensorManager.getSensor('Block 1');

      expect(state).toBe(SensorState.ACTIVE);
      expect(sensorManager.getSensorState('IS1')).toBe(SensorState.ACTIVE);
      expect(sensorManager.getCachedSensors().has('Block 1')).toBe(false);
    });

    it('should emit sensor:changed when a fetch finds a different cached state', async () => {
      mockClient.emit('update', { type: 'sensor', data: { name: 'IS2', state: SensorState.ACTIVE } });
      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS2', state: SensorState.INACTIVE } });

      await sensorManager.getSensor('IS2');

      expect(spy).toHaveBeenCalledWith('IS2', SensorState.INACTIVE);
    });

    it('should not emit sensor:changed on the first fetch of a sensor', async () => {
      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS1', state: SensorState.INACTIVE } });

      await sensorManager.getSensor('IS1');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not cache anything when JMRI rejects the request', async () => {
      mockClient.request.mockRejectedValue(new Error('Unable to access sensor IS999.'));

      await expect(sensorManager.getSensor('IS999')).rejects.toThrow('IS999');

      expect(sensorManager.getSensorState('IS999')).toBeUndefined();
    });

    it('should return UNKNOWN when response has no state', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS1' } });

      const state = await sensorManager.getSensor('IS1');

      expect(state).toBe(SensorState.UNKNOWN);
    });
  });

  describe('setSensor', () => {
    it('should send a post request with the given state', async () => {
      mockClient.request.mockResolvedValue({});

      await sensorManager.setSensor('IS1', SensorState.ACTIVE);

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'sensor',
        method: 'post',
        data: { name: 'IS1', state: SensorState.ACTIVE }
      });
    });

    it('should update the cached state', async () => {
      mockClient.request.mockResolvedValue({});

      await sensorManager.setSensor('IS1', SensorState.INACTIVE);

      expect(sensorManager.getSensorState('IS1')).toBe(SensorState.INACTIVE);
    });

    it('should emit sensor:changed when state changes', async () => {
      mockClient.request.mockResolvedValue({});

      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);

      await sensorManager.setSensor('IS1', SensorState.ACTIVE);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('IS1', SensorState.ACTIVE);
    });

    it('should not emit sensor:changed when state has not changed', async () => {
      mockClient.request.mockResolvedValue({});

      await sensorManager.setSensor('IS1', SensorState.ACTIVE);

      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);

      await sensorManager.setSensor('IS1', SensorState.ACTIVE);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should cache and emit the state JMRI reports back, not the requested one', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'LS1', state: SensorState.INACTIVE } });

      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);

      await sensorManager.setSensor('LS1', SensorState.ACTIVE);

      expect(sensorManager.getSensorState('LS1')).toBe(SensorState.INACTIVE);
      expect(spy).toHaveBeenCalledWith('LS1', SensorState.INACTIVE);
    });

    it.each([
      ['UNKNOWN', SensorState.UNKNOWN],
      ['INCONSISTENT', SensorState.INCONSISTENT]
    ])('should reject %s without sending anything', async (_label, state) => {
      await expect(sensorManager.setSensor('IS1', state as any)).rejects.toThrow(/ACTIVE or INACTIVE/);

      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it('should propagate server errors and leave the cache alone', async () => {
      mockClient.request.mockRejectedValue(new Error('JMRI error 500'));

      await expect(sensorManager.setSensor('LS1', SensorState.ACTIVE)).rejects.toThrow('JMRI error 500');

      expect(sensorManager.getSensorState('LS1')).toBeUndefined();
    });
  });

  describe('setSensorActive', () => {
    it('should set state to ACTIVE', async () => {
      mockClient.request.mockResolvedValue({});

      await sensorManager.setSensorActive('IS1');

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'sensor',
        method: 'post',
        data: { name: 'IS1', state: SensorState.ACTIVE }
      });
    });
  });

  describe('setSensorInactive', () => {
    it('should set state to INACTIVE', async () => {
      mockClient.request.mockResolvedValue({});

      await sensorManager.setSensorInactive('IS1');

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'sensor',
        method: 'post',
        data: { name: 'IS1', state: SensorState.INACTIVE }
      });
    });
  });

  describe('listSensors', () => {
    const listResponse = {
      type: 'sensor',
      data: [
        { type: 'sensor', data: { name: 'IS1', userName: 'Block 1', comment: null, inverted: false, state: SensorState.INACTIVE } },
        { type: 'sensor', data: { name: 'IS2', userName: 'Block 2', comment: null, inverted: true, state: SensorState.ACTIVE } }
      ],
      id: 1
    };

    it('should request a list of all sensors', async () => {
      mockClient.request.mockResolvedValue(listResponse);

      const sensors = await sensorManager.listSensors();

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'sensor',
        method: 'list'
      });
      expect(sensors).toHaveLength(2);
      expect(sensors[0].name).toBe('IS1');
      expect(sensors[1].name).toBe('IS2');
      expect(sensors[1].inverted).toBe(true);
    });

    it('should cache states from the list response', async () => {
      mockClient.request.mockResolvedValue(listResponse);

      await sensorManager.listSensors();

      expect(sensorManager.getSensorState('IS1')).toBe(SensorState.INACTIVE);
      expect(sensorManager.getSensorState('IS2')).toBe(SensorState.ACTIVE);
    });

    it('should return empty array for non-array response', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: {} });

      const sensors = await sensorManager.listSensors();

      expect(sensors).toEqual([]);
    });
  });

  describe('getSensorState', () => {
    it('should return undefined for unknown sensors', () => {
      expect(sensorManager.getSensorState('NOPE')).toBeUndefined();
    });
  });

  describe('getCachedSensors', () => {
    it('should return a copy of all cached states', async () => {
      mockClient.request.mockResolvedValue({});

      await sensorManager.setSensor('IS1', SensorState.INACTIVE);
      await sensorManager.setSensor('IS2', SensorState.ACTIVE);

      const cached = sensorManager.getCachedSensors();

      expect(cached.size).toBe(2);
      expect(cached.get('IS1')).toBe(SensorState.INACTIVE);
      expect(cached.get('IS2')).toBe(SensorState.ACTIVE);
    });

    it('should return a copy, not a reference to internal state', async () => {
      mockClient.request.mockResolvedValue({});

      await sensorManager.setSensor('IS1', SensorState.INACTIVE);
      const cached = sensorManager.getCachedSensors();
      cached.set('IS1', SensorState.ACTIVE);

      expect(sensorManager.getSensorState('IS1')).toBe(SensorState.INACTIVE);
    });
  });

  describe('unsolicited server updates', () => {
    it('should handle a server-pushed sensor update', (done) => {
      sensorManager.on('sensor:changed', (name, state) => {
        expect(name).toBe('IS1');
        expect(state).toBe(SensorState.ACTIVE);
        done();
      });

      mockClient.emit('update', {
        type: 'sensor',
        data: { name: 'IS1', state: SensorState.ACTIVE }
      });
    });

    it('should update the cache from server push', () => {
      mockClient.emit('update', {
        type: 'sensor',
        data: { name: 'IS1', state: SensorState.INCONSISTENT }
      });

      expect(sensorManager.getSensorState('IS1')).toBe(SensorState.INCONSISTENT);
    });

    it('should not emit event if state has not changed', () => {
      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);

      mockClient.emit('update', { type: 'sensor', data: { name: 'IS1', state: SensorState.INACTIVE } });
      mockClient.emit('update', { type: 'sensor', data: { name: 'IS1', state: SensorState.INACTIVE } });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should ignore updates with no name', () => {
      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);

      mockClient.emit('update', { type: 'sensor', data: { state: SensorState.INACTIVE } });

      expect(spy).not.toHaveBeenCalled();
    });

    it('should ignore non-sensor updates', () => {
      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);

      mockClient.emit('update', { type: 'light', data: { name: 'IL1', state: 2 } });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('after reconnecting', () => {
    const flush = () => new Promise(resolve => setImmediate(resolve));

    it('should fetch subscribed sensors again so JMRI resumes sending changes', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS1', state: SensorState.INACTIVE } });
      await sensorManager.getSensor('IS1');
      mockClient.request.mockClear();

      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).toHaveBeenCalledWith({ type: 'sensor', data: { name: 'IS1' } });
    });

    it('should fetch sensors that were only set, since JMRI subscribes on set too', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS100', state: SensorState.ACTIVE } });
      await sensorManager.setSensorActive('IS100');
      mockClient.request.mockClear();

      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).toHaveBeenCalledWith({ type: 'sensor', data: { name: 'IS100' } });
    });

    it('should send all re-fetches without waiting for each reply', async () => {
      mockClient.request.mockImplementation(async (m: any) => ({ type: 'sensor', data: { name: m.data.name, state: SensorState.INACTIVE } }));
      await sensorManager.getSensor('IS1');
      await sensorManager.getSensor('IS2');
      mockClient.request.mockReset();
      mockClient.request.mockReturnValue(new Promise(() => {}));

      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).toHaveBeenCalledTimes(2);
    });

    it('should stop re-fetching a sensor JMRI says no longer exists', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS5', state: SensorState.INACTIVE } });
      await sensorManager.getSensor('IS5');
      const gone = Object.assign(new Error('Unable to access sensor IS5.'), { code: 404 });
      mockClient.request.mockReset();
      mockClient.request.mockRejectedValue(gone);
      sensorManager.on('error', () => {});

      mockClient.emit('reconnected');
      await flush();
      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).toHaveBeenCalledTimes(1);
      expect(sensorManager.getSensorState('IS5')).toBeUndefined();
    });

    it('should keep re-fetching after errors other than 404', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS5', state: SensorState.INACTIVE } });
      await sensorManager.getSensor('IS5');
      mockClient.request.mockReset();
      mockClient.request.mockRejectedValue(new Error('Request timeout after 10000ms'));
      sensorManager.on('error', () => {});

      mockClient.emit('reconnected');
      await flush();
      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).toHaveBeenCalledTimes(2);
    });

    it('should not subscribe to sensors that were only listed', async () => {
      mockClient.request.mockResolvedValue({
        type: 'sensor',
        data: [{ type: 'sensor', data: { name: 'IS1', state: SensorState.INACTIVE } }]
      });
      await sensorManager.listSensors();
      mockClient.request.mockClear();

      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it('should emit sensor:changed for changes missed while disconnected', async () => {
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS1', state: SensorState.INACTIVE } });
      await sensorManager.getSensor('IS1');

      const spy = jest.fn();
      sensorManager.on('sensor:changed', spy);
      mockClient.request.mockResolvedValue({ type: 'sensor', data: { name: 'IS1', state: SensorState.ACTIVE } });

      mockClient.emit('reconnected');
      await flush();

      expect(spy).toHaveBeenCalledWith('IS1', SensorState.ACTIVE);
    });

    it('should keep going when one sensor fails to refresh', async () => {
      mockClient.request.mockImplementation(async (m: any) => ({ type: 'sensor', data: { name: m.data.name, state: SensorState.INACTIVE } }));
      await sensorManager.getSensor('IS1');
      await sensorManager.getSensor('IS2');
      mockClient.request.mockReset();
      mockClient.request
        .mockRejectedValueOnce(new Error('gone'))
        .mockResolvedValueOnce({ type: 'sensor', data: { name: 'IS2', state: SensorState.ACTIVE } });

      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).toHaveBeenCalledTimes(2);
      expect(sensorManager.getSensorState('IS2')).toBe(SensorState.ACTIVE);
    });
  });
});
