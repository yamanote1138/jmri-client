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
});
