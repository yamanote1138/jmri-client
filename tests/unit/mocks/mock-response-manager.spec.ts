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
});
