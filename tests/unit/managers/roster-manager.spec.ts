import { RosterManager } from '../../../src/managers/roster-manager';
import { WebSocketClient } from '../../../src/core/websocket-client';
import { RosterMessage, RosterResponse } from '../../../src/types/jmri-messages';

jest.mock('../../../src/core/websocket-client');

describe('RosterManager', () => {
  let rosterManager: RosterManager;
  let mockClient: jest.Mocked<WebSocketClient>;

  const mockRosterData: RosterResponse = [
    {
      type: 'rosterEntry',
      data: {
        name: 'Big Boy',
        address: '3985',
        isLongAddress: true,
        road: 'UP',
        model: '4-8-8-4'
      },
      id: 1
    },
    {
      type: 'rosterEntry',
      data: {
        name: 'Diesel',
        address: '754',
        isLongAddress: true,
        road: 'CSX'
      },
      id: 2
    },
    {
      type: 'rosterEntry',
      data: {
        name: 'Switcher',
        address: '10',
        isLongAddress: false
      },
      id: 3
    }
  ];

  beforeEach(() => {
    mockClient = {
      request: jest.fn()
    } as any;
    rosterManager = new RosterManager(mockClient as any);
  });

  describe('getRoster', () => {
    it('should fetch and return all roster entries', async () => {
      const response: RosterMessage = {
        type: 'roster',
        method: 'list',
        data: mockRosterData
      };

      mockClient.request.mockResolvedValue(response);

      const roster = await rosterManager.getRoster();

      expect(roster).toHaveLength(3);
      expect(roster[0].name).toBe('Big Boy');
      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'roster',
        method: 'list'
      });
    });

    it('should cache roster entries', async () => {
      mockClient.request.mockResolvedValue({
        type: 'roster',
        method: 'list',
        data: mockRosterData
      });

      await rosterManager.getRoster();

      const cached = rosterManager.getCachedRoster();
      expect(cached).toHaveLength(3);
    });
  });

  describe('getRosterEntryByName', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'roster',
        method: 'list',
        data: mockRosterData
      });
      await rosterManager.getRoster();
    });

    it('should return entry by exact name', async () => {
      const entry = await rosterManager.getRosterEntryByName('Big Boy');

      expect(entry).toBeDefined();
      expect(entry?.name).toBe('Big Boy');
      expect(entry?.address).toBe('3985');
    });

    it('should return undefined for non-existent name', async () => {
      const entry = await rosterManager.getRosterEntryByName('NonExistent');

      expect(entry).toBeUndefined();
    });

    it('should fetch roster if cache is empty', async () => {
      const freshManager = new RosterManager(mockClient as any);

      mockClient.request.mockResolvedValue({
        type: 'roster',
        method: 'list',
        data: mockRosterData
      });

      const entry = await freshManager.getRosterEntryByName('Diesel');

      expect(entry).toBeDefined();
      expect(mockClient.request).toHaveBeenCalled();
    });
  });

  describe('getRosterEntryByAddress', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'roster',
        method: 'list',
        data: mockRosterData
      });
      await rosterManager.getRoster();
    });

    it('should return entry by address string', async () => {
      const entry = await rosterManager.getRosterEntryByAddress('754');

      expect(entry).toBeDefined();
      expect(entry?.name).toBe('Diesel');
    });

    it('should return entry by address number', async () => {
      const entry = await rosterManager.getRosterEntryByAddress(10);

      expect(entry).toBeDefined();
      expect(entry?.name).toBe('Switcher');
    });

    it('should return undefined for non-existent address', async () => {
      const entry = await rosterManager.getRosterEntryByAddress(9999);

      expect(entry).toBeUndefined();
    });
  });

  describe('searchRoster', () => {
    beforeEach(async () => {
      mockClient.request.mockResolvedValue({
        type: 'roster',
        method: 'list',
        data: mockRosterData
      });
      await rosterManager.getRoster();
    });

    it('should search by partial name match', async () => {
      const results = await rosterManager.searchRoster('Big');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Big Boy');
    });

    it('should search by address', async () => {
      const results = await rosterManager.searchRoster('754');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Diesel');
    });

    it('should search by road', async () => {
      const results = await rosterManager.searchRoster('UP');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Big Boy');
    });

    it('should be case insensitive', async () => {
      const results = await rosterManager.searchRoster('big boy');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Big Boy');
    });

    it('should return multiple matches', async () => {
      const results = await rosterManager.searchRoster('e'); // Matches Diesel and Switcher

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const results = await rosterManager.searchRoster('zzz');

      expect(results).toEqual([]);
    });
  });

  describe('getCachedRoster', () => {
    it('should return empty array when cache is empty', () => {
      const cached = rosterManager.getCachedRoster();

      expect(cached).toEqual([]);
    });

    it('should return cached entries without network request', async () => {
      mockClient.request.mockResolvedValue({
        type: 'roster',
        method: 'list',
        data: mockRosterData
      });

      await rosterManager.getRoster();

      mockClient.request.mockClear();

      const cached = rosterManager.getCachedRoster();

      expect(cached).toHaveLength(3);
      expect(mockClient.request).not.toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear cached roster entries', async () => {
      mockClient.request.mockResolvedValue({
        type: 'roster',
        method: 'list',
        data: mockRosterData
      });

      await rosterManager.getRoster();
      expect(rosterManager.getCachedRoster()).toHaveLength(3);

      rosterManager.clearCache();

      expect(rosterManager.getCachedRoster()).toEqual([]);
    });
  });
});
