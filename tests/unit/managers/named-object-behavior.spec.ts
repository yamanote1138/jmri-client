import { LightManager } from '../../../src/managers/light-manager';
import { TurnoutManager } from '../../../src/managers/turnout-manager';
import { LightState, TurnoutState } from '../../../src/types/jmri-messages';
import { EventEmitter } from 'events';

// Behavior lights and turnouts share with sensors (see sensor-manager.spec.ts)
const cases = [
  {
    label: 'TurnoutManager',
    create: (client: any) => new TurnoutManager(client),
    type: 'turnout',
    event: 'turnout:changed',
    systemName: 'LT1',
    userName: 'Main Diverge',
    stateA: TurnoutState.CLOSED,
    stateB: TurnoutState.THROWN,
    moving: TurnoutState.INCONSISTENT,
    get: (m: any, name: string) => m.getTurnout(name),
    set: (m: any, name: string, state: number) => m.setTurnout(name, state),
    list: (m: any) => m.listTurnouts(),
    cached: (m: any, name: string) => m.getTurnoutState(name)
  },
  {
    label: 'LightManager',
    create: (client: any) => new LightManager(client),
    type: 'light',
    event: 'light:changed',
    systemName: 'IL1',
    userName: 'Yard Light',
    stateA: LightState.OFF,
    stateB: LightState.ON,
    moving: LightState.UNKNOWN,
    get: (m: any, name: string) => m.getLight(name),
    set: (m: any, name: string, state: number) => m.setLight(name, state),
    list: (m: any) => m.listLights(),
    cached: (m: any, name: string) => m.getLightState(name)
  }
];

describe.each(cases)('$label shared behavior', (c) => {
  let manager: any;
  let mockClient: any;
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const reply = (name: string, state: number) => ({ type: c.type, data: { name, state } });

  beforeEach(() => {
    mockClient = new EventEmitter();
    mockClient.request = jest.fn();
    manager = c.create(mockClient);
  });

  it('caches under the system name JMRI replies with when given a user name', async () => {
    mockClient.request.mockResolvedValue(reply(c.systemName, c.stateB));

    const state = await c.get(manager, c.userName);

    expect(state).toBe(c.stateB);
    expect(c.cached(manager, c.systemName)).toBe(c.stateB);
    expect(manager[`getCached${c.label.replace('Manager', '')}s`]().has(c.userName)).toBe(false);
  });

  it('emits a change when a fetch finds a different cached state', async () => {
    mockClient.emit('update', reply(c.systemName, c.stateA));
    const spy = jest.fn();
    manager.on(c.event, spy);
    mockClient.request.mockResolvedValue(reply(c.systemName, c.stateB));

    await c.get(manager, c.systemName);

    expect(spy).toHaveBeenCalledWith(c.systemName, c.stateB);
  });

  it('does not emit a change on the first fetch', async () => {
    const spy = jest.fn();
    manager.on(c.event, spy);
    mockClient.request.mockResolvedValue(reply(c.systemName, c.stateA));

    await c.get(manager, c.systemName);

    expect(spy).not.toHaveBeenCalled();
  });

  it('caches and emits the state JMRI reports back after a set', async () => {
    mockClient.request.mockResolvedValue(reply(c.systemName, c.moving));
    const spy = jest.fn();
    manager.on(c.event, spy);

    await c.set(manager, c.systemName, c.stateB);

    expect(c.cached(manager, c.systemName)).toBe(c.moving);
    expect(spy).toHaveBeenCalledWith(c.systemName, c.moving);
  });

  describe('after reconnecting', () => {
    it('fetches objects that were fetched or set, but not ones only listed', async () => {
      mockClient.request.mockImplementation(async (m: any) =>
        m.method === 'list'
          ? { type: c.type, data: [reply('X3', c.stateA)] }
          : reply(m.data.name, m.data.state ?? c.stateA));
      await c.get(manager, 'X1');
      await c.set(manager, 'X2', c.stateB);
      await c.list(manager);
      mockClient.request.mockClear();

      mockClient.emit('reconnected');
      await flush();

      const names = mockClient.request.mock.calls.map((call: any[]) => call[0].data.name).sort();
      expect(names).toEqual(['X1', 'X2']);
      expect(mockClient.request).toHaveBeenCalledWith({ type: c.type, data: { name: 'X1' } });
    });

    it('emits changes missed while disconnected', async () => {
      mockClient.request.mockResolvedValue(reply(c.systemName, c.stateA));
      await c.get(manager, c.systemName);
      const spy = jest.fn();
      manager.on(c.event, spy);
      mockClient.request.mockResolvedValue(reply(c.systemName, c.stateB));

      mockClient.emit('reconnected');
      await flush();

      expect(spy).toHaveBeenCalledWith(c.systemName, c.stateB);
    });

    it('stops fetching an object JMRI says no longer exists', async () => {
      mockClient.request.mockResolvedValue(reply(c.systemName, c.stateA));
      await c.get(manager, c.systemName);
      mockClient.request.mockReset();
      mockClient.request.mockRejectedValue(Object.assign(new Error('gone'), { code: 404 }));
      const errors = jest.fn();
      manager.on('error', errors);

      mockClient.emit('reconnected');
      await flush();
      mockClient.emit('reconnected');
      await flush();

      expect(mockClient.request).toHaveBeenCalledTimes(1);
      expect(errors).toHaveBeenCalledTimes(1);
      expect(c.cached(manager, c.systemName)).toBeUndefined();
    });
  });
});
