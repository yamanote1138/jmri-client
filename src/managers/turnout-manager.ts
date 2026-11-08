// Turnout (switch) manager

import { WebSocketClient } from '../core/websocket-client.js';
import { TurnoutState, TurnoutData } from '../types/jmri-messages.js';
import { NamedObjectManager } from './named-object-manager.js';

/** Manages JMRI turnout (track switch) state */
export class TurnoutManager extends NamedObjectManager<TurnoutState, TurnoutData> {
  constructor(client: WebSocketClient) {
    super(client, 'turnout', 'turnout:changed', TurnoutState.UNKNOWN);
  }

  /** Get a turnout's state by system or user name; JMRI then pushes its changes */
  async getTurnout(name: string): Promise<TurnoutState> {
    return this.fetchState(name);
  }

  /** Set a turnout to the given state */
  async setTurnout(name: string, state: TurnoutState): Promise<void> {
    return this.postState(name, state);
  }

  /** Throw a turnout (diverging route) */
  async throwTurnout(name: string): Promise<void> {
    return this.setTurnout(name, TurnoutState.THROWN);
  }

  /** Close a turnout (straight through / normal) */
  async closeTurnout(name: string): Promise<void> {
    return this.setTurnout(name, TurnoutState.CLOSED);
  }

  /** List all turnouts known to JMRI (does not subscribe to their changes) */
  async listTurnouts(): Promise<TurnoutData[]> {
    return this.listAll();
  }

  /** Get cached turnout state without a network request */
  getTurnoutState(name: string): TurnoutState | undefined {
    return this.cachedState(name);
  }

  /** Get all cached turnout states */
  getCachedTurnouts(): Map<string, TurnoutState> {
    return this.cachedStates();
  }
}
