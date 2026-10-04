import { SystemConnectionsManager } from '../../../src/managers/system-connections-manager';
import { EventEmitter } from 'events';

describe('SystemConnectionsManager', () => {
  let manager: SystemConnectionsManager;
  let mockClient: any;

  beforeEach(() => {
    mockClient = new EventEmitter();
    mockClient.request = jest.fn();
    manager = new SystemConnectionsManager(mockClient);
  });

  it('unwraps per-element messages from a real JMRI list reply', async () => {
    mockClient.request.mockResolvedValue({
      type: 'list',
      data: [
        { type: 'systemConnection', data: { name: 'LocoNet', prefix: 'L', mfg: 'Digitrax' }, id: 1 },
        { type: 'systemConnection', data: { name: 'Internal', prefix: 'I', mfg: null }, id: 1 }
      ]
    });

    const connections = await manager.getSystemConnections();

    expect(connections).toEqual([
      { name: 'LocoNet', prefix: 'L', mfg: 'Digitrax' },
      { name: 'Internal', prefix: 'I', mfg: null }
    ]);
  });

  it('accepts plain connection objects', async () => {
    mockClient.request.mockResolvedValue({
      type: 'systemConnections',
      data: [{ name: 'LocoNet', prefix: 'L' }]
    });

    expect(await manager.getSystemConnections()).toEqual([{ name: 'LocoNet', prefix: 'L' }]);
  });

  it('returns an empty list when there is no data', async () => {
    mockClient.request.mockResolvedValue({ type: 'systemConnections' });

    expect(await manager.getSystemConnections()).toEqual([]);
  });
});
