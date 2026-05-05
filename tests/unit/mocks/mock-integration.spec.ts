/**
 * End-to-end tests using JmriClient in mock mode.
 *
 * These tests exercise the full pipeline from public API call through
 * MockResponseManager and back through the manager event system — the seam
 * that pure unit tests (which stub WebSocketClient.request) cannot cover.
 */

import { JmriClient } from '../../../src/client';
import { PowerState, LightState, TurnoutState } from '../../../src/types/jmri-messages';
import { ConnectionState } from '../../../src/types/events';

jest.mock('ws');

function makeMockClient(overrides: Record<string, any> = {}): JmriClient {
  return new JmriClient({
    autoConnect: false,
    mock: { enabled: true, responseDelay: 0, ...overrides }
  });
}

describe('Mock mode integration', () => {
  let client: JmriClient;

  beforeEach(async () => {
    client = makeMockClient();
    await client.connect();
  });

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect();
    }
  });

  // -------------------------------------------------------------------------
  describe('connection', () => {
    it('is connected after connect()', () => {
      expect(client.isConnected()).toBe(true);
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });

    it('emits connected event on connect()', async () => {
      const fresh = makeMockClient();
      const connected = new Promise<void>(resolve => fresh.on('connected', resolve));
      await fresh.connect();
      await connected;
      await fresh.disconnect();
    });

    it('emits hello event with server info', async () => {
      const fresh = makeMockClient();
      const hello = new Promise<any>(resolve => fresh.on('hello', resolve));
      await fresh.connect();
      const data = await hello;
      expect(data.railroad).toBe('Demo Railroad');
      expect(data.JMRI).toBe('5.9.2');
      await fresh.disconnect();
    });

    it('is disconnected after disconnect()', async () => {
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('power', () => {
    it('initial state is OFF', async () => {
      const state = await client.getPower();
      expect(state).toBe(PowerState.OFF);
    });

    it('powerOn() returns ON state', async () => {
      await client.powerOn();
      const state = await client.getPower();
      expect(state).toBe(PowerState.ON);
    });

    it('powerOn() emits power:changed with ON', async () => {
      const changed = new Promise<PowerState>(resolve => {
        client.on('power:changed', resolve);
      });
      await client.powerOn();
      expect(await changed).toBe(PowerState.ON);
    });

    it('powerOff() after powerOn() returns OFF', async () => {
      await client.powerOn();
      await client.powerOff();
      const state = await client.getPower();
      expect(state).toBe(PowerState.OFF);
    });

    it('powerOff() emits power:changed with OFF', async () => {
      await client.powerOn();
      const changed = new Promise<PowerState>(resolve => {
        client.on('power:changed', resolve);
      });
      await client.powerOff();
      expect(await changed).toBe(PowerState.OFF);
    });
  });

  // -------------------------------------------------------------------------
  describe('roster', () => {
    it('getRoster() returns 3 default entries', async () => {
      const roster = await client.getRoster();
      expect(roster).toHaveLength(3);
    });

    it('roster entries have correct types', async () => {
      const roster = await client.getRoster();
      roster.forEach(entry => expect(entry.type).toBe('rosterEntry'));
    });

    it('getRosterEntryByName returns correct entry', async () => {
      await client.getRoster();
      const entry = await client.getRosterEntryByName('CSX754');
      expect(entry).toBeDefined();
      expect(entry?.data.address).toBe('754');
    });

    it('getRosterEntryByAddress returns correct entry', async () => {
      await client.getRoster();
      const entry = await client.getRosterEntryByAddress('3985');
      expect(entry).toBeDefined();
      expect(entry?.data.name).toBe('UP3985');
    });

    it('getRosterEntryByName returns undefined for unknown name', async () => {
      await client.getRoster();
      const entry = await client.getRosterEntryByName('DOES_NOT_EXIST');
      expect(entry).toBeUndefined();
    });

    it('roster entries include function keys', async () => {
      const roster = await client.getRoster();
      const csx = roster.find(e => e.data.name === 'CSX754');
      expect(csx?.data.functionKeys?.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('lights', () => {
    it('listLights() returns 3 default lights', async () => {
      const lights = await client.listLights();
      expect(lights).toHaveLength(3);
    });

    it('default light names are present', async () => {
      const lights = await client.listLights();
      const names = lights.map(l => l.name);
      expect(names).toContain('IL1');
      expect(names).toContain('IL2');
      expect(names).toContain('IL3');
    });

    it('IL3 starts in ON state', async () => {
      await client.listLights(); // populate cache
      expect(client.getLightState('IL3')).toBe(LightState.ON);
    });

    it('IL1 starts in OFF state', async () => {
      await client.listLights();
      expect(client.getLightState('IL1')).toBe(LightState.OFF);
    });

    it('turnOnLight() changes state to ON', async () => {
      await client.turnOnLight('IL1');
      expect(client.getLightState('IL1')).toBe(LightState.ON);
    });

    it('turnOnLight() emits light:changed', async () => {
      const changed = new Promise<{ name: string; state: LightState }>(resolve => {
        client.on('light:changed', (name, state) => resolve({ name, state }));
      });
      await client.turnOnLight('IL1');
      const result = await changed;
      expect(result.name).toBe('IL1');
      expect(result.state).toBe(LightState.ON);
    });

    it('turnOffLight() on an ON light changes state to OFF', async () => {
      await client.turnOnLight('IL3'); // IL3 starts ON, turn it off
      await client.turnOffLight('IL3');
      expect(client.getLightState('IL3')).toBe(LightState.OFF);
    });

    it('state changes persist across calls', async () => {
      await client.turnOnLight('IL1');
      await client.turnOnLight('IL1'); // same state — should not re-emit
      expect(client.getLightState('IL1')).toBe(LightState.ON);
    });

    it('getCachedLights() reflects updated states', async () => {
      await client.listLights();
      await client.turnOnLight('IL1');
      const cached = client.getCachedLights();
      expect(cached.get('IL1')).toBe(LightState.ON);
    });
  });

  // -------------------------------------------------------------------------
  describe('turnouts', () => {
    it('listTurnouts() returns 3 default turnouts', async () => {
      const turnouts = await client.listTurnouts();
      expect(turnouts).toHaveLength(3);
    });

    it('default turnout names are present', async () => {
      const turnouts = await client.listTurnouts();
      const names = turnouts.map(t => t.name);
      expect(names).toContain('LT1');
      expect(names).toContain('LT2');
      expect(names).toContain('LT3');
    });

    it('LT1 starts CLOSED', async () => {
      await client.listTurnouts();
      expect(client.getTurnoutState('LT1')).toBe(TurnoutState.CLOSED);
    });

    it('LT3 starts THROWN', async () => {
      await client.listTurnouts();
      expect(client.getTurnoutState('LT3')).toBe(TurnoutState.THROWN);
    });

    it('throwTurnout() changes state to THROWN', async () => {
      await client.throwTurnout('LT1');
      expect(client.getTurnoutState('LT1')).toBe(TurnoutState.THROWN);
    });

    it('throwTurnout() emits turnout:changed', async () => {
      const changed = new Promise<{ name: string; state: TurnoutState }>(resolve => {
        client.on('turnout:changed', (name, state) => resolve({ name, state }));
      });
      await client.throwTurnout('LT1');
      const result = await changed;
      expect(result.name).toBe('LT1');
      expect(result.state).toBe(TurnoutState.THROWN);
    });

    it('closeTurnout() changes THROWN turnout back to CLOSED', async () => {
      await client.closeTurnout('LT3');
      expect(client.getTurnoutState('LT3')).toBe(TurnoutState.CLOSED);
    });
  });

  // -------------------------------------------------------------------------
  describe('throttle lifecycle', () => {
    it('acquireThrottle() returns a throttle ID', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('acquireThrottle() emits throttle:acquired', async () => {
      const acquired = new Promise<string>(resolve => {
        client.on('throttle:acquired', resolve);
      });
      await client.acquireThrottle({ address: 754 });
      const id = await acquired;
      expect(typeof id).toBe('string');
    });

    it('getThrottleState() returns initial speed of 0', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      const state = client.getThrottleState(id);
      expect(state?.speed).toBe(0);
    });

    it('setThrottleSpeed() updates speed in client state', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      await client.setThrottleSpeed(id, 0.5);
      const state = client.getThrottleState(id);
      expect(state?.speed).toBe(0.5);
    });

    it('setThrottleSpeed() emits throttle:updated with speed', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      const updated = new Promise<{ id: string; data: any }>(resolve => {
        client.on('throttle:updated', (tid, data) => resolve({ id: tid, data }));
      });
      await client.setThrottleSpeed(id, 0.75);
      const result = await updated;
      expect(result.data.speed).toBe(0.75);
    });

    it('setThrottleDirection() updates direction', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      await client.setThrottleDirection(id, false);
      const state = client.getThrottleState(id);
      expect(state?.forward).toBe(false);
    });

    it('setThrottleFunction() updates function state', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      await client.setThrottleFunction(id, 'F0', true);
      // verify via the updated event
      const updated = new Promise<any>(resolve => {
        client.on('throttle:updated', (_, data) => resolve(data));
      });
      await client.setThrottleFunction(id, 'F1', true);
      const data = await updated;
      expect(data.F1).toBe(true);
    });

    it('emergencyStop() sets speed to 0', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      await client.setThrottleSpeed(id, 0.8);
      await client.emergencyStop(id);
      expect(client.getThrottleState(id)?.speed).toBe(0);
    });

    it('releaseThrottle() emits throttle:released', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      const released = new Promise<string>(resolve => {
        client.on('throttle:released', resolve);
      });
      await client.releaseThrottle(id);
      expect(await released).toBe(id);
    });

    it('getThrottleState() returns undefined after release', async () => {
      const id = await client.acquireThrottle({ address: 754 });
      await client.releaseThrottle(id);
      expect(client.getThrottleState(id)).toBeUndefined();
    });

    it('getThrottleIds() reflects acquired throttles', async () => {
      const id1 = await client.acquireThrottle({ address: 1 });
      const id2 = await client.acquireThrottle({ address: 2 });
      expect(client.getThrottleIds()).toContain(id1);
      expect(client.getThrottleIds()).toContain(id2);
    });
  });

  // -------------------------------------------------------------------------
  describe('custom config via inline object', () => {
    let customClient: JmriClient;

    beforeEach(async () => {
      customClient = new JmriClient({
        autoConnect: false,
        mock: {
          enabled: true,
          responseDelay: 0,
          config: {
            server: { railroad: 'Custom Layout', jmri: '99.0' },
            roster: [
              { name: 'MY-ENGINE', address: '42', model: 'Test Loco' }
            ],
            lights: [
              { name: 'CL1', userName: 'Custom Light', state: 'ON' }
            ],
            turnouts: [
              { name: 'CT1', userName: 'Custom Turnout', state: 'THROWN' }
            ],
            power: { initialState: 'ON' }
          }
        }
      });
      await customClient.connect();
    });

    afterEach(async () => {
      if (customClient.isConnected()) await customClient.disconnect();
    });

    it('hello carries custom railroad name', async () => {
      const fresh = new JmriClient({
        autoConnect: false,
        mock: {
          enabled: true,
          responseDelay: 0,
          config: { server: { railroad: 'Custom Layout', jmri: '99.0' } }
        }
      });
      const hello = new Promise<any>(resolve => fresh.on('hello', resolve));
      await fresh.connect();
      const data = await hello;
      expect(data.railroad).toBe('Custom Layout');
      await fresh.disconnect();
    });

    it('initial power state is ON when configured', async () => {
      const state = await customClient.getPower();
      expect(state).toBe(PowerState.ON);
    });

    it('getRoster() returns only the custom entry', async () => {
      const roster = await customClient.getRoster();
      expect(roster).toHaveLength(1);
      expect(roster[0].data.name).toBe('MY-ENGINE');
    });

    it('listLights() returns only the custom light', async () => {
      const lights = await customClient.listLights();
      expect(lights).toHaveLength(1);
      expect(lights[0].name).toBe('CL1');
    });

    it('custom light starts in configured ON state', async () => {
      await customClient.listLights();
      expect(customClient.getLightState('CL1')).toBe(LightState.ON);
    });

    it('listTurnouts() returns only the custom turnout', async () => {
      const turnouts = await customClient.listTurnouts();
      expect(turnouts).toHaveLength(1);
      expect(turnouts[0].name).toBe('CT1');
    });

    it('custom turnout starts THROWN', async () => {
      await customClient.listTurnouts();
      expect(customClient.getTurnoutState('CT1')).toBe(TurnoutState.THROWN);
    });

    it('default lights are absent when custom lights are configured', async () => {
      const lights = await customClient.listLights();
      const names = lights.map(l => l.name);
      expect(names).not.toContain('IL1');
      expect(names).not.toContain('IL2');
      expect(names).not.toContain('IL3');
    });
  });
});
