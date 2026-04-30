/**
 * System connections manager — discovers available JMRI hardware connection prefixes
 */

import { WebSocketClient } from '../core/websocket-client.js';
import { SystemConnectionData, SystemConnectionsMessage } from '../types/jmri-messages.js';

export class SystemConnectionsManager {
  private client: WebSocketClient;

  constructor(client: WebSocketClient) {
    this.client = client;
  }

  /**
   * List all available JMRI system connections and their prefixes.
   * Use the returned prefix values with power and throttle commands to
   * target a specific hardware connection when multiple are configured.
   */
  async getSystemConnections(): Promise<SystemConnectionData[]> {
    const message: SystemConnectionsMessage = {
      type: 'systemConnections',
      method: 'list'
    };

    const response = await this.client.request<SystemConnectionsMessage>(message);

    if (!response.data) {
      return [];
    }

    return Array.isArray(response.data) ? response.data : [response.data];
  }
}
