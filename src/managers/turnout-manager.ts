/**
 * Turnout (switch) manager
 */

import { EventEmitter } from 'eventemitter3';
import { WebSocketClient } from '../core/websocket-client.js';
import { TurnoutState, TurnoutData, TurnoutMessage } from '../types/jmri-messages.js';

/**
 * Manages JMRI turnout (track switch) state
 */
export class TurnoutManager extends EventEmitter {
  private client: WebSocketClient;
  private turnouts: Map<string, TurnoutState> = new Map();

  constructor(client: WebSocketClient) {
    super();
    this.client = client;

    this.client.on('update', (message: any) => {
      if (message.type === 'turnout') {
        this.handleTurnoutUpdate(message);
      }
    });
  }

  /**
   * Get the current state of a turnout.
   * Also registers a server-side listener so subsequent changes are pushed.
   */
  async getTurnout(name: string): Promise<TurnoutState> {
    const message: TurnoutMessage = {
      type: 'turnout',
      data: { name }
    };

    const response = await this.client.request<TurnoutMessage>(message);
    const state = response.data?.state ?? TurnoutState.UNKNOWN;
    this.turnouts.set(name, state);
    return state;
  }

  /**
   * Set a turnout to the given state
   */
  async setTurnout(name: string, state: TurnoutState): Promise<void> {
    const message: TurnoutMessage = {
      type: 'turnout',
      method: 'post',
      data: { name, state }
    };

    await this.client.request<TurnoutMessage>(message);

    const oldState = this.turnouts.get(name);
    this.turnouts.set(name, state);

    if (oldState !== state) {
      this.emit('turnout:changed', name, state);
    }
  }

  /**
   * Throw a turnout (diverging route)
   */
  async throwTurnout(name: string): Promise<void> {
    return this.setTurnout(name, TurnoutState.THROWN);
  }

  /**
   * Close a turnout (straight through / normal)
   */
  async closeTurnout(name: string): Promise<void> {
    return this.setTurnout(name, TurnoutState.CLOSED);
  }

  /**
   * List all turnouts known to JMRI
   */
  async listTurnouts(): Promise<TurnoutData[]> {
    const message: TurnoutMessage = {
      type: 'turnout',
      method: 'list'
    };

    const response = await this.client.request<any>(message);
    const entries: TurnoutData[] = Array.isArray(response) ? response.map((r: any) => r.data ?? r) : [];

    for (const entry of entries) {
      if (entry.name && entry.state !== undefined) {
        this.turnouts.set(entry.name, entry.state);
      }
    }

    return entries;
  }

  /**
   * Get cached turnout state without a network request
   */
  getTurnoutState(name: string): TurnoutState | undefined {
    return this.turnouts.get(name);
  }

  /**
   * Get all cached turnout states
   */
  getCachedTurnouts(): Map<string, TurnoutState> {
    return new Map(this.turnouts);
  }

  /**
   * Handle unsolicited turnout state updates from JMRI
   */
  private handleTurnoutUpdate(message: TurnoutMessage): void {
    const name = message.data?.name;
    const state = message.data?.state;

    if (!name || state === undefined) return;

    const oldState = this.turnouts.get(name);
    this.turnouts.set(name, state);

    if (oldState !== state) {
      this.emit('turnout:changed', name, state);
    }
  }
}
