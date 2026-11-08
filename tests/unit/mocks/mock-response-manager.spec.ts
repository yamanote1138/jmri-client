import { MockResponseManager } from '../../../src/mocks/mock-response-manager';

describe('MockResponseManager', () => {
  let manager: MockResponseManager;

  beforeEach(() => {
    manager = new MockResponseManager({ responseDelay: 0 });
  });

  describe('getRosterGroups', () => {
    it('should return a list of roster groups', async () => {
      const response = await manager.getMockResponse({ type: 'rosterGroup', method: 'list' });

      expect(response).not.toBeNull();
      expect(response!.type).toBe('rosterGroup');
      expect(Array.isArray(response!.data)).toBe(true);
      expect(response!.data.length).toBeGreaterThan(0);
    });

    it('should return groups with name and length', async () => {
      const response = await manager.getMockResponse({ type: 'rosterGroup', method: 'list' });

      const groups = response!.data as Array<{ type: string; data: { name: string; length: number } }>;
      expect(groups[0].type).toBe('rosterGroup');
      expect(typeof groups[0].data.name).toBe('string');
      expect(typeof groups[0].data.length).toBe('number');
    });
  });

  describe('getRosterEntriesByGroup', () => {
    it('should return only entries belonging to the requested group', async () => {
      const groupsResponse = await manager.getMockResponse({ type: 'rosterGroup', method: 'list' });
      const groups = groupsResponse!.data as Array<{ type: string; data: { name: string; length: number } }>;
      const firstGroupName = groups[0].data.name;

      const response = await manager.getMockResponse({
        type: 'roster',
        method: 'list',
        params: { group: firstGroupName }
      });

      expect(response).not.toBeNull();
      const entries = response!.data as Array<{ type: string; data: { rosterGroups: string[] } }>;
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(entry.data.rosterGroups).toContain(firstGroupName);
      }
    });

    it('should return empty array for unknown group', async () => {
      const response = await manager.getMockResponse({
        type: 'roster',
        method: 'list',
        params: { group: 'no-such-group' }
      });

      expect(response!.data).toEqual([]);
    });
  });

  describe('power with prefix', () => {
    it('should track power state independently per prefix', async () => {
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: 2, prefix: 'L' } });
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: 4, prefix: 'DC' } });

      const locoNet = await manager.getMockResponse({ type: 'power', data: { state: 0, prefix: 'L' } });
      const dc = await manager.getMockResponse({ type: 'power', data: { state: 0, prefix: 'DC' } });

      expect(locoNet!.data.state).toBe(2); // ON
      expect(dc!.data.state).toBe(4);      // OFF
    });

    it('should not affect default power state when setting a prefixed state', async () => {
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: 2 } });
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: 4, prefix: 'L' } });

      const defaultState = await manager.getMockResponse({ type: 'power' });
      expect(defaultState!.data.state).toBe(2); // still ON
    });

    it('should return UNKNOWN for an unseen prefix', async () => {
      const response = await manager.getMockResponse({ type: 'power', data: { state: 0, prefix: 'UNKNOWN' } });
      expect(response!.data.state).toBe(0); // UNKNOWN
    });

    it('should reflect prefix in power response', async () => {
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: 2, prefix: 'L' } });
      const response = await manager.getMockResponse({ type: 'power', data: { state: 0, prefix: 'L' } });

      expect(response!.data.prefix).toBe('L');
    });
  });

  describe('throttle acquire with prefix', () => {
    it('should include prefix in throttle acquire response', async () => {
      const response = await manager.getMockResponse({
        type: 'throttle',
        data: { address: 3, name: 'test-throttle', prefix: 'L' }
      });

      expect(response!.type).toBe('throttle');
      expect(response!.data.prefix).toBe('L');
    });

    it('should acquire throttle without prefix when none given', async () => {
      const response = await manager.getMockResponse({
        type: 'throttle',
        data: { address: 42, name: 'test-throttle-2' }
      });

      expect(response!.type).toBe('throttle');
      expect(response!.data.prefix).toBeUndefined();
    });
  });

  describe('sensors', () => {
    it('should list sensors with state and inverted flag', async () => {
      const response = await manager.getMockResponse({ type: 'sensor', method: 'list' });

      const sensors = response!.data as Array<{ type: string; data: { name: string; inverted: boolean; state: number } }>;
      expect(response!.type).toBe('sensor');
      expect(sensors.length).toBeGreaterThan(0);
      expect(sensors[0].type).toBe('sensor');
      expect(typeof sensors[0].data.inverted).toBe('boolean');
    });

    it('should return the state of a known sensor', async () => {
      const response = await manager.getMockResponse({ type: 'sensor', data: { name: 'IS1' } });

      expect(response!.data.name).toBe('IS1');
      expect(response!.data.state).toBe(4); // INACTIVE
    });

    it('should remember a posted state', async () => {
      await manager.getMockResponse({ type: 'sensor', method: 'post', data: { name: 'IS1', state: 2 } });
      const response = await manager.getMockResponse({ type: 'sensor', data: { name: 'IS1' } });

      expect(response!.data.state).toBe(2); // ACTIVE
    });

    it('should ignore posts of UNKNOWN like JMRI does', async () => {
      await manager.getMockResponse({ type: 'sensor', method: 'post', data: { name: 'IS1', state: 0 } });
      const response = await manager.getMockResponse({ type: 'sensor', data: { name: 'IS1' } });

      expect(response!.data.state).toBe(4); // still INACTIVE
    });

    it('should reset sensor states', async () => {
      await manager.getMockResponse({ type: 'sensor', method: 'post', data: { name: 'IS1', state: 2 } });
      manager.reset();

      expect(manager.getSensors().get('IS1')).toBe(4);
    });
  });
});
