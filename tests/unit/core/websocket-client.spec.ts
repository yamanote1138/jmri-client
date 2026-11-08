import { WebSocketClient } from '../../../src/core/websocket-client';
import { mergeOptions } from '../../../src/types/client-options';

describe('WebSocketClient response matching', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    client = new WebSocketClient(mergeOptions({ autoConnect: false, heartbeat: { enabled: false } }));
  });

  it('resolves a request answered with a bare array (as JMRI does for systemConnections)', async () => {
    const message: any = { type: 'systemConnections', method: 'list' };
    const pending = client.request(message, 1000);

    const reply = [
      { type: 'systemConnection', data: { name: 'LocoNet', prefix: 'L' }, id: message.id },
      { type: 'systemConnection', data: { name: 'Internal', prefix: 'I' }, id: message.id }
    ];
    (client as any).handleMessage(JSON.stringify(reply));

    const response = await pending;
    expect(response.data).toEqual(reply);
  });

  it('emits a bare array with no matching request as an update', () => {
    const updates: any[] = [];
    client.on('update', (m: any) => updates.push(m));

    (client as any).handleMessage(JSON.stringify([{ type: 'systemConnection', data: { name: 'X' }, id: 999 }]));

    expect(updates).toHaveLength(1);
  });

  it('does not let a push for another named object settle a pending request', async () => {
    const updates: any[] = [];
    client.on('update', (m: any) => updates.push(m));
    const message: any = { type: 'sensor', data: { name: 'IS1' } };
    const pending = client.request(message, 1000);

    (client as any).handleMessage(JSON.stringify({ type: 'sensor', data: { name: 'IS2', state: 2 } }));
    (client as any).handleMessage(JSON.stringify({ type: 'sensor', data: { name: 'IS1', state: 4 }, id: message.id }));

    const response = await pending;
    expect(response.data.name).toBe('IS1');
    expect(updates.map(u => u.data.name)).toEqual(['IS2']);
  });

  it('does not let a named push settle a pending list request', async () => {
    const updates: any[] = [];
    client.on('update', (m: any) => updates.push(m));
    const message: any = { type: 'sensor', method: 'list' };
    const pending = client.request(message, 1000);

    (client as any).handleMessage(JSON.stringify({ type: 'sensor', data: { name: 'IS2', state: 2 } }));
    const reply = [{ type: 'sensor', data: { name: 'IS1', state: 4 }, id: message.id }];
    (client as any).handleMessage(JSON.stringify(reply));

    const response = await pending;
    expect(response.data).toEqual(reply);
    expect(updates).toHaveLength(1);
  });

  it('still matches an id-less reply to a pending request for the same name', async () => {
    const message: any = { type: 'sensor', data: { name: 'IS1' } };
    const pending = client.request(message, 1000);

    (client as any).handleMessage(JSON.stringify({ type: 'sensor', data: { name: 'IS1', state: 2 } }));

    const response = await pending;
    expect(response.data.state).toBe(2);
  });

  it('rejects a request when JMRI replies with an error', async () => {
    const message: any = { type: 'sensor', data: { name: 'IS999' } };
    const pending = client.request(message, 1000);

    (client as any).handleMessage(JSON.stringify({
      type: 'error',
      data: { code: 404, message: 'Unable to access sensor IS999.' },
      id: message.id
    }));

    await expect(pending).rejects.toThrow('Unable to access sensor IS999.');
    await pending.catch((e: any) => expect(e.code).toBe(404));
  });

  it('matches an id-less throttle reply to a request that names the throttle as data.throttle', async () => {
    const message: any = { type: 'throttle', data: { throttle: 'c1-3', release: null } };
    const pending = client.request(message, 1000);

    (client as any).handleMessage(JSON.stringify({ type: 'throttle', data: { throttle: 'c1-3', release: null } }));

    const response = await pending;
    expect(response.data.throttle).toBe('c1-3');
  });

  it('still matches an id-less reply by type when the request names nothing', async () => {
    const message: any = { type: 'power', data: { state: 0, prefix: 'L' } };
    const pending = client.request(message, 1000);

    (client as any).handleMessage(JSON.stringify({ type: 'power', data: { name: 'LocoNet', state: 2 } }));

    const response = await pending;
    expect(response.data.state).toBe(2);
  });
});
