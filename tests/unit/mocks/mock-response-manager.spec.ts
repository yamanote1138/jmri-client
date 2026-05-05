import { MockResponseManager } from '../../../src/mocks/mock-response-manager';
import { DEFAULT_MOCK_CONFIG, MockConfig } from '../../../src/mocks/mock-config';
import { PowerState, LightState, TurnoutState } from '../../../src/types/jmri-messages';

function makeManager(overrides: Partial<MockConfig> = {}): MockResponseManager {
  return new MockResponseManager({
    ...DEFAULT_MOCK_CONFIG,
    ...overrides,
    timing: { responseDelay: 0, connectionDelay: 0 }
  });
}

describe('MockResponseManager', () => {
  let manager: MockResponseManager;

  beforeEach(() => {
    manager = makeManager();
  });

  // -------------------------------------------------------------------------
  describe('hello response', () => {
    it('returns server info from DEFAULT_MOCK_CONFIG', async () => {
      const response = await manager.getMockResponse({ type: 'hello' });
      expect(response?.type).toBe('hello');
      expect((response as any).data.railroad).toBe('Demo Railroad');
      expect((response as any).data.JMRI).toBe('5.9.2');
    });

    it('uses custom railroad name from config', async () => {
      const m = makeManager({ server: { ...DEFAULT_MOCK_CONFIG.server, railroad: 'My Layout' } });
      const response = await m.getMockResponse({ type: 'hello' });
      expect((response as any).data.railroad).toBe('My Layout');
    });

    it('uses custom heartbeat interval from config', async () => {
      const m = makeManager({ server: { ...DEFAULT_MOCK_CONFIG.server, heartbeat: 5000 } });
      const response = await m.getMockResponse({ type: 'hello' });
      expect((response as any).data.heartbeat).toBe(5000);
    });
  });

  // -------------------------------------------------------------------------
  describe('power state', () => {
    it('initial state is OFF by default', async () => {
      const response = await manager.getMockResponse({ type: 'power' });
      expect((response as any).data.state).toBe(PowerState.OFF);
    });

    it('initial state can be configured to ON', async () => {
      const m = makeManager({ power: { initialState: 'ON' } });
      const response = await m.getMockResponse({ type: 'power' });
      expect((response as any).data.state).toBe(PowerState.ON);
    });

    it('POST updates the power state', async () => {
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: PowerState.ON } });
      const response = await manager.getMockResponse({ type: 'power' });
      expect((response as any).data.state).toBe(PowerState.ON);
    });

    it('state persists across multiple GET calls', async () => {
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: PowerState.ON } });
      await manager.getMockResponse({ type: 'power' });
      const response = await manager.getMockResponse({ type: 'power' });
      expect((response as any).data.state).toBe(PowerState.ON);
    });

    it('getPowerState() reflects current state', async () => {
      expect(manager.getPowerState()).toBe(PowerState.OFF);
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: PowerState.ON } });
      expect(manager.getPowerState()).toBe(PowerState.ON);
    });
  });

  // -------------------------------------------------------------------------
  describe('roster', () => {
    it('list returns all configured entries', async () => {
      const response = await manager.getMockResponse({ type: 'roster', method: 'list' });
      const entries: any[] = (response as any).data;
      expect(entries).toHaveLength(3);
    });

    it('entries contain expected locomotive names', async () => {
      const response = await manager.getMockResponse({ type: 'roster', method: 'list' });
      const names = (response as any).data.map((e: any) => e.data.name);
      expect(names).toContain('CSX754');
      expect(names).toContain('UP3985');
      expect(names).toContain('BNSF5240');
    });

    it('entries include function keys', async () => {
      const response = await manager.getMockResponse({ type: 'roster', method: 'list' });
      const csx = (response as any).data.find((e: any) => e.data.name === 'CSX754');
      expect(csx.data.functionKeys).toBeInstanceOf(Array);
      expect(csx.data.functionKeys.length).toBeGreaterThan(0);
      expect(csx.data.functionKeys[0].name).toBe('F0');
    });

    it('entries are wrapped with type and sequential id', async () => {
      const response = await manager.getMockResponse({ type: 'roster', method: 'list' });
      const entries: any[] = (response as any).data;
      entries.forEach((entry, i) => {
        expect(entry.type).toBe('rosterEntry');
        expect(entry.id).toBe(i + 1);
      });
    });

    it('non-list request returns empty array', async () => {
      const response = await manager.getMockResponse({ type: 'roster' });
      expect((response as any).data).toEqual([]);
    });

    it('uses custom roster from config', async () => {
      const m = makeManager({
        roster: [{ name: 'CUSTOM', address: '99' }]
      });
      const response = await m.getMockResponse({ type: 'roster', method: 'list' });
      const entries: any[] = (response as any).data;
      expect(entries).toHaveLength(1);
      expect(entries[0].data.name).toBe('CUSTOM');
    });
  });

  // -------------------------------------------------------------------------
  describe('lights', () => {
    it('list returns all configured lights', async () => {
      const response = await manager.getMockResponse({ type: 'light', method: 'list' });
      expect(Array.isArray((response as any).data)).toBe(true);
      expect((response as any).data).toHaveLength(3);
    });

    it('default IL1 state is OFF', async () => {
      const response = await manager.getMockResponse({ type: 'light', method: 'list' });
      const il1 = (response as any).data.find((l: any) => l.data.name === 'IL1');
      expect(il1.data.state).toBe(LightState.OFF);
    });

    it('default IL3 state is ON', async () => {
      const response = await manager.getMockResponse({ type: 'light', method: 'list' });
      const il3 = (response as any).data.find((l: any) => l.data.name === 'IL3');
      expect(il3.data.state).toBe(LightState.ON);
    });

    it('POST updates light state', async () => {
      await manager.getMockResponse({
        type: 'light', method: 'post', data: { name: 'IL1', state: LightState.ON }
      });
      const response = await manager.getMockResponse({
        type: 'light', data: { name: 'IL1' }
      });
      expect((response as any).data.state).toBe(LightState.ON);
    });

    it('GET returns updated state after POST', async () => {
      await manager.getMockResponse({
        type: 'light', method: 'post', data: { name: 'IL1', state: LightState.ON }
      });
      const list = await manager.getMockResponse({ type: 'light', method: 'list' });
      const il1 = (list as any).data.find((l: any) => l.data.name === 'IL1');
      expect(il1.data.state).toBe(LightState.ON);
    });

    it('GET for unconfigured light returns UNKNOWN', async () => {
      const response = await manager.getMockResponse({
        type: 'light', data: { name: 'NONEXISTENT' }
      });
      expect((response as any).data.state).toBe(LightState.UNKNOWN);
    });

    it('uses custom lights from config', async () => {
      const m = makeManager({
        lights: [{ name: 'IL99', userName: 'Custom Light', state: 'ON' }]
      });
      const response = await m.getMockResponse({ type: 'light', method: 'list' });
      const entries: any[] = (response as any).data;
      expect(entries).toHaveLength(1);
      expect(entries[0].data.name).toBe('IL99');
      expect(entries[0].data.state).toBe(LightState.ON);
    });

    it('list entries include userName from config', async () => {
      const response = await manager.getMockResponse({ type: 'light', method: 'list' });
      const il1 = (response as any).data.find((l: any) => l.data.name === 'IL1');
      expect(il1.data.userName).toBe('Yard Light');
    });
  });

  // -------------------------------------------------------------------------
  describe('turnouts', () => {
    it('list returns all configured turnouts', async () => {
      const response = await manager.getMockResponse({ type: 'turnout', method: 'list' });
      expect(Array.isArray((response as any).data)).toBe(true);
      expect((response as any).data).toHaveLength(3);
    });

    it('default LT1 state is CLOSED', async () => {
      const response = await manager.getMockResponse({ type: 'turnout', method: 'list' });
      const lt1 = (response as any).data.find((t: any) => t.data.name === 'LT1');
      expect(lt1.data.state).toBe(TurnoutState.CLOSED);
    });

    it('default LT3 state is THROWN', async () => {
      const response = await manager.getMockResponse({ type: 'turnout', method: 'list' });
      const lt3 = (response as any).data.find((t: any) => t.data.name === 'LT3');
      expect(lt3.data.state).toBe(TurnoutState.THROWN);
    });

    it('POST updates turnout state', async () => {
      await manager.getMockResponse({
        type: 'turnout', method: 'post', data: { name: 'LT1', state: TurnoutState.THROWN }
      });
      const response = await manager.getMockResponse({
        type: 'turnout', data: { name: 'LT1' }
      });
      expect((response as any).data.state).toBe(TurnoutState.THROWN);
    });

    it('GET returns updated state after POST', async () => {
      await manager.getMockResponse({
        type: 'turnout', method: 'post', data: { name: 'LT3', state: TurnoutState.CLOSED }
      });
      const list = await manager.getMockResponse({ type: 'turnout', method: 'list' });
      const lt3 = (list as any).data.find((t: any) => t.data.name === 'LT3');
      expect(lt3.data.state).toBe(TurnoutState.CLOSED);
    });

    it('GET for unconfigured turnout returns UNKNOWN', async () => {
      const response = await manager.getMockResponse({
        type: 'turnout', data: { name: 'NONEXISTENT' }
      });
      expect((response as any).data.state).toBe(TurnoutState.UNKNOWN);
    });

    it('uses custom turnouts from config', async () => {
      const m = makeManager({
        turnouts: [{ name: 'LT99', state: 'THROWN' }]
      });
      const response = await m.getMockResponse({ type: 'turnout', method: 'list' });
      const entries: any[] = (response as any).data;
      expect(entries).toHaveLength(1);
      expect(entries[0].data.name).toBe('LT99');
      expect(entries[0].data.state).toBe(TurnoutState.THROWN);
    });
  });

  // -------------------------------------------------------------------------
  describe('throttle', () => {
    it('acquire returns throttle state with given address', async () => {
      const response = await manager.getMockResponse({
        type: 'throttle', data: { address: 754 }
      });
      expect((response as any).data.address).toBe(754);
      expect((response as any).data.speed).toBe(0);
      expect((response as any).data.forward).toBe(true);
    });

    it('acquire registers throttle in internal state', async () => {
      const response = await manager.getMockResponse({
        type: 'throttle', data: { address: 754 }
      });
      const id = (response as any).data.throttle;
      expect(manager.getThrottles().has(id)).toBe(true);
    });

    it('speed control updates throttle state', async () => {
      const acq = await manager.getMockResponse({
        type: 'throttle', data: { address: 100 }
      });
      const id = (acq as any).data.throttle;
      await manager.getMockResponse({
        type: 'throttle', data: { throttle: id, speed: 0.75 }
      });
      expect(manager.getThrottles().get(id).speed).toBe(0.75);
    });

    it('direction control updates throttle state', async () => {
      const acq = await manager.getMockResponse({
        type: 'throttle', data: { address: 100 }
      });
      const id = (acq as any).data.throttle;
      await manager.getMockResponse({
        type: 'throttle', data: { throttle: id, forward: false }
      });
      expect(manager.getThrottles().get(id).forward).toBe(false);
    });

    it('function key control updates throttle state', async () => {
      const acq = await manager.getMockResponse({
        type: 'throttle', data: { address: 100 }
      });
      const id = (acq as any).data.throttle;
      await manager.getMockResponse({
        type: 'throttle', data: { throttle: id, F0: true }
      });
      expect(manager.getThrottles().get(id).F0).toBe(true);
    });

    it('release removes throttle from internal state', async () => {
      const acq = await manager.getMockResponse({
        type: 'throttle', data: { address: 100 }
      });
      const id = (acq as any).data.throttle;
      await manager.getMockResponse({
        type: 'throttle', data: { throttle: id, release: true }
      });
      expect(manager.getThrottles().has(id)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('ping → pong', () => {
    it('returns pong for ping', async () => {
      const response = await manager.getMockResponse({ type: 'ping' });
      expect(response?.type).toBe('pong');
    });
  });

  // -------------------------------------------------------------------------
  describe('reset()', () => {
    it('resets power to config initial state (OFF)', async () => {
      await manager.getMockResponse({ type: 'power', method: 'post', data: { state: PowerState.ON } });
      manager.reset();
      expect(manager.getPowerState()).toBe(PowerState.OFF);
    });

    it('resets power to configured ON state', async () => {
      const m = makeManager({ power: { initialState: 'ON' } });
      await m.getMockResponse({ type: 'power', method: 'post', data: { state: PowerState.OFF } });
      m.reset();
      expect(m.getPowerState()).toBe(PowerState.ON);
    });

    it('resets light states to config values', async () => {
      await manager.getMockResponse({
        type: 'light', method: 'post', data: { name: 'IL1', state: LightState.ON }
      });
      await manager.getMockResponse({
        type: 'light', method: 'post', data: { name: 'IL3', state: LightState.OFF }
      });
      manager.reset();
      expect(manager.getLights().get('IL1')).toBe(LightState.OFF);
      expect(manager.getLights().get('IL3')).toBe(LightState.ON);
    });

    it('resets turnout states to config values', async () => {
      await manager.getMockResponse({
        type: 'turnout', method: 'post', data: { name: 'LT3', state: TurnoutState.CLOSED }
      });
      manager.reset();
      expect(manager.getTurnouts().get('LT3')).toBe(TurnoutState.THROWN);
    });

    it('clears all acquired throttles', async () => {
      await manager.getMockResponse({ type: 'throttle', data: { address: 1 } });
      await manager.getMockResponse({ type: 'throttle', data: { address: 2 } });
      expect(manager.getThrottles().size).toBe(2);
      manager.reset();
      expect(manager.getThrottles().size).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('response delay', () => {
    it('waits approximately responseDelay ms before responding', async () => {
      const m = new MockResponseManager({
        ...DEFAULT_MOCK_CONFIG,
        timing: { responseDelay: 50 }
      });
      const start = Date.now();
      await m.getMockResponse({ type: 'ping' });
      expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });

    it('responds immediately when responseDelay is 0', async () => {
      const start = Date.now();
      await manager.getMockResponse({ type: 'ping' });
      expect(Date.now() - start).toBeLessThan(20);
    });
  });

  // -------------------------------------------------------------------------
  describe('unknown message type', () => {
    it('returns null for unrecognised message types', async () => {
      const response = await manager.getMockResponse({ type: 'unknown-type' } as any);
      expect(response).toBeNull();
    });
  });
});
