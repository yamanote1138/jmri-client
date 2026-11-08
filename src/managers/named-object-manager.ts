// Shared state handling for JMRI named objects (sensors, lights, turnouts)

import { EventEmitter } from 'eventemitter3';
import { WebSocketClient } from '../core/websocket-client.js';
import { JmriMessage } from '../types/jmri-messages.js';

/** Data every named object carries */
export interface NamedObjectData<TState> {
  name: string;
  state?: TState;
}

/** Caches named object states, keeps JMRI subscriptions alive across reconnects, and emits changes */
export abstract class NamedObjectManager<TState, TData extends NamedObjectData<TState>> extends EventEmitter {
  protected client: WebSocketClient;
  private states: Map<string, TState> = new Map();
  private subscribed: Set<string> = new Set();

  constructor(client: WebSocketClient, private readonly type: string, private readonly changeEvent: string, private readonly unknownState: TState) {
    super();
    this.client = client;

    this.client.on('update', (message: any) => {
      if (message.type === this.type) {
        this.handleUpdate(message);
      }
    });

    this.client.on('reconnected', () => {
      void this.resubscribe();
    });
  }

  /** Fetch by system or user name; JMRI then pushes changes, cached under the system name it replies with */
  protected async fetchState(name: string): Promise<TState> {
    const response = await this.client.request<any>({ type: this.type, data: { name } } as JmriMessage);
    const state: TState = response?.data?.state ?? this.unknownState;
    const systemName: string = response?.data?.name || name;
    const known = this.states.has(systemName);
    this.subscribed.add(systemName);
    if (known) {
      this.updateState(systemName, state);
    } else {
      this.states.set(systemName, state);
    }
    return state;
  }

  /** Post a new state; the cache and change event use the state JMRI reports back */
  protected async postState(name: string, state: TState): Promise<void> {
    const response = await this.client.request<any>({ type: this.type, method: 'post', data: { name, state } } as JmriMessage);
    const systemName: string = response?.data?.name || name;
    this.subscribed.add(systemName);
    this.updateState(systemName, response?.data?.state ?? state);
  }

  /** List every object of this type (does not subscribe to their changes) */
  protected async listAll(): Promise<TData[]> {
    const response = await this.client.request<any>({ type: this.type, method: 'list' } as JmriMessage);
    const entries: TData[] = Array.isArray(response?.data)
      ? response.data.map((r: any) => r.data ?? r)
      : [];

    for (const entry of entries) {
      if (entry.name && entry.state !== undefined) {
        this.states.set(entry.name, entry.state);
      }
    }

    return entries;
  }

  /** Cached state without a network request */
  protected cachedState(name: string): TState | undefined {
    return this.states.get(name);
  }

  /** Copy of all cached states */
  protected cachedStates(): Map<string, TState> {
    return new Map(this.states);
  }

  /** Re-fetch subscribed objects at once so the new connection gets their changes again */
  private async resubscribe(): Promise<void> {
    await Promise.all([...this.subscribed].map(async name => {
      try {
        const response = await this.client.request<any>({ type: this.type, data: { name } } as JmriMessage);
        this.updateState(name, response?.data?.state ?? this.unknownState);
      } catch (error) {
        if ((error as any)?.code === 404) {
          this.subscribed.delete(name);
          this.states.delete(name);
        }
        this.emit('error', error);
      }
    }));
  }

  /** Handle unsolicited state updates from JMRI */
  private handleUpdate(message: any): void {
    const name = message.data?.name;
    const state = message.data?.state;

    if (!name || state === undefined) return;

    this.updateState(name, state);
  }

  /** Cache a state and emit the change event if it differs */
  private updateState(name: string, state: TState): void {
    const oldState = this.states.get(name);
    this.states.set(name, state);

    if (oldState !== state) {
      this.emit(this.changeEvent, name, state);
    }
  }
}
