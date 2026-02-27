import { TurnoutManager } from '../../../src/managers/turnout-manager';
import { WebSocketClient } from '../../../src/core/websocket-client';
import { TurnoutState, TurnoutMessage } from '../../../src/types/jmri-messages';
import { EventEmitter } from 'events';

jest.mock('../../../src/core/websocket-client');

describe('TurnoutManager', () => {
  let turnoutManager: TurnoutManager;
  let mockClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    mockClient = new EventEmitter() as any;
    mockClient.request = jest.fn();
    turnoutManager = new TurnoutManager(mockClient as any);
  });

  describe('getTurnout', () => {
    it('should request and return the current state', async () => {
      const response: TurnoutMessage = {
        type: 'turnout',
        data: { name: 'LT1', state: TurnoutState.CLOSED }
      };

      mockClient.request.mockResolvedValue(response);

      const state = await turnoutManager.getTurnout('LT1');

      expect(state).toBe(TurnoutState.CLOSED);
      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'turnout',
        data: { name: 'LT1' }
      });
    });

    it('should cache the turnout state', async () => {
      mockClient.request.mockResolvedValue({
        type: 'turnout',
        data: { name: 'LT1', state: TurnoutState.THROWN }
      });

      await turnoutManager.getTurnout('LT1');

      expect(turnoutManager.getTurnoutState('LT1')).toBe(TurnoutState.THROWN);
    });

    it('should return UNKNOWN when response has no state', async () => {
      mockClient.request.mockResolvedValue({ type: 'turnout', data: { name: 'LT1' } });

      const state = await turnoutManager.getTurnout('LT1');

      expect(state).toBe(TurnoutState.UNKNOWN);
    });
  });

  describe('setTurnout', () => {
    it('should send a post request with the given state', async () => {
      mockClient.request.mockResolvedValue({});

      await turnoutManager.setTurnout('LT1', TurnoutState.THROWN);

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'turnout',
        method: 'post',
        data: { name: 'LT1', state: TurnoutState.THROWN }
      });
    });

    it('should update the cached state', async () => {
      mockClient.request.mockResolvedValue({});

      await turnoutManager.setTurnout('LT1', TurnoutState.THROWN);

      expect(turnoutManager.getTurnoutState('LT1')).toBe(TurnoutState.THROWN);
    });

    it('should emit turnout:changed when state changes', async () => {
      mockClient.request.mockResolvedValue({});

      const spy = jest.fn();
      turnoutManager.on('turnout:changed', spy);

      await turnoutManager.setTurnout('LT1', TurnoutState.THROWN);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('LT1', TurnoutState.THROWN);
    });

    it('should not emit turnout:changed when state has not changed', async () => {
      mockClient.request.mockResolvedValue({});

      await turnoutManager.setTurnout('LT1', TurnoutState.THROWN);

      const spy = jest.fn();
      turnoutManager.on('turnout:changed', spy);

      await turnoutManager.setTurnout('LT1', TurnoutState.THROWN);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('throwTurnout', () => {
    it('should set state to THROWN', async () => {
      mockClient.request.mockResolvedValue({});

      await turnoutManager.throwTurnout('LT1');

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'turnout',
        method: 'post',
        data: { name: 'LT1', state: TurnoutState.THROWN }
      });
    });
  });

  describe('closeTurnout', () => {
    it('should set state to CLOSED', async () => {
      mockClient.request.mockResolvedValue({});

      await turnoutManager.closeTurnout('LT1');

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'turnout',
        method: 'post',
        data: { name: 'LT1', state: TurnoutState.CLOSED }
      });
    });
  });

  describe('listTurnouts', () => {
    it('should request a list of all turnouts', async () => {
      mockClient.request.mockResolvedValue({
        type: 'turnout',
        data: [
          { type: 'turnout', data: { name: 'LT1', state: TurnoutState.CLOSED } },
          { type: 'turnout', data: { name: 'LT2', state: TurnoutState.THROWN } }
        ],
        id: 1
      });

      const turnouts = await turnoutManager.listTurnouts();

      expect(mockClient.request).toHaveBeenCalledWith({
        type: 'turnout',
        method: 'list'
      });
      expect(turnouts).toHaveLength(2);
      expect(turnouts[0].name).toBe('LT1');
      expect(turnouts[1].name).toBe('LT2');
    });

    it('should cache states from the list response', async () => {
      mockClient.request.mockResolvedValue({
        type: 'turnout',
        data: [
          { type: 'turnout', data: { name: 'LT1', state: TurnoutState.CLOSED } },
          { type: 'turnout', data: { name: 'LT2', state: TurnoutState.THROWN } }
        ],
        id: 1
      });

      await turnoutManager.listTurnouts();

      expect(turnoutManager.getTurnoutState('LT1')).toBe(TurnoutState.CLOSED);
      expect(turnoutManager.getTurnoutState('LT2')).toBe(TurnoutState.THROWN);
    });

    it('should return empty array for non-array response', async () => {
      mockClient.request.mockResolvedValue({ type: 'turnout', data: {} });

      const turnouts = await turnoutManager.listTurnouts();

      expect(turnouts).toEqual([]);
    });
  });

  describe('getTurnoutState', () => {
    it('should return undefined for unknown turnouts', () => {
      expect(turnoutManager.getTurnoutState('UNKNOWN_TURNOUT')).toBeUndefined();
    });
  });

  describe('getCachedTurnouts', () => {
    it('should return a copy of all cached states', async () => {
      mockClient.request.mockResolvedValue({});

      await turnoutManager.setTurnout('LT1', TurnoutState.CLOSED);
      await turnoutManager.setTurnout('LT2', TurnoutState.THROWN);

      const cached = turnoutManager.getCachedTurnouts();

      expect(cached.size).toBe(2);
      expect(cached.get('LT1')).toBe(TurnoutState.CLOSED);
      expect(cached.get('LT2')).toBe(TurnoutState.THROWN);
    });

    it('should return a copy, not a reference to internal state', async () => {
      mockClient.request.mockResolvedValue({});

      await turnoutManager.setTurnout('LT1', TurnoutState.CLOSED);
      const cached = turnoutManager.getCachedTurnouts();
      cached.set('LT1', TurnoutState.THROWN);

      expect(turnoutManager.getTurnoutState('LT1')).toBe(TurnoutState.CLOSED);
    });
  });

  describe('unsolicited server updates', () => {
    it('should handle a server-pushed turnout update', (done) => {
      turnoutManager.on('turnout:changed', (name, state) => {
        expect(name).toBe('LT1');
        expect(state).toBe(TurnoutState.THROWN);
        done();
      });

      mockClient.emit('update', {
        type: 'turnout',
        data: { name: 'LT1', state: TurnoutState.THROWN }
      });
    });

    it('should update the cache from server push', () => {
      mockClient.emit('update', {
        type: 'turnout',
        data: { name: 'LT1', state: TurnoutState.CLOSED }
      });

      expect(turnoutManager.getTurnoutState('LT1')).toBe(TurnoutState.CLOSED);
    });

    it('should not emit event if state has not changed', () => {
      const spy = jest.fn();
      turnoutManager.on('turnout:changed', spy);

      mockClient.emit('update', { type: 'turnout', data: { name: 'LT1', state: TurnoutState.CLOSED } });
      mockClient.emit('update', { type: 'turnout', data: { name: 'LT1', state: TurnoutState.CLOSED } });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should ignore updates with no name', () => {
      const spy = jest.fn();
      turnoutManager.on('turnout:changed', spy);

      mockClient.emit('update', { type: 'turnout', data: { state: TurnoutState.CLOSED } });

      expect(spy).not.toHaveBeenCalled();
    });

    it('should ignore non-turnout updates', () => {
      const spy = jest.fn();
      turnoutManager.on('turnout:changed', spy);

      mockClient.emit('update', { type: 'power', data: { state: 2 } });

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
