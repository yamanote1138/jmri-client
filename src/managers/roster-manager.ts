/**
 * Roster management
 */

import { WebSocketClient } from '../core/websocket-client.js';
import { RosterMessage, RosterData, RosterResponse, RosterEntryWrapper } from '../types/jmri-messages.js';

/**
 * Manages locomotive roster
 */
export class RosterManager {
  private client: WebSocketClient;
  private rosterCache: Map<string, RosterEntryWrapper> = new Map();

  constructor(client: WebSocketClient) {
    this.client = client;
  }

  /**
   * Get all roster entries
   */
  async getRoster(): Promise<RosterEntryWrapper[]> {
    const message: RosterMessage = {
      type: 'roster',
      method: 'list'
    };

    const response = await this.client.request<RosterMessage>(message);

    // Parse roster data
    if (response.data) {
      this.updateCache(response.data);
    }

    return Array.from(this.rosterCache.values());
  }

  /**
   * Get roster entry by name
   */
  async getRosterEntryByName(name: string): Promise<RosterEntryWrapper | undefined> {
    // Check cache first
    if (this.rosterCache.has(name)) {
      return this.rosterCache.get(name);
    }

    // Refresh roster
    await this.getRoster();
    return this.rosterCache.get(name);
  }

  /**
   * Get roster entry by address
   */
  async getRosterEntryByAddress(address: string | number): Promise<RosterEntryWrapper | undefined> {
    // Ensure roster is loaded
    if (this.rosterCache.size === 0) {
      await this.getRoster();
    }

    const addressStr = address.toString();

    for (const wrapper of this.rosterCache.values()) {
      if (wrapper.data.address === addressStr) {
        return wrapper;
      }
    }

    return undefined;
  }

  /**
   * Search roster by partial name match
   */
  async searchRoster(query: string): Promise<RosterEntryWrapper[]> {
    // Ensure roster is loaded
    if (this.rosterCache.size === 0) {
      await this.getRoster();
    }

    const lowerQuery = query.toLowerCase();
    const results: RosterEntryWrapper[] = [];

    for (const wrapper of this.rosterCache.values()) {
      const entry = wrapper.data;
      if (
        entry.name.toLowerCase().includes(lowerQuery) ||
        entry.address.includes(query) ||
        entry.road?.toLowerCase().includes(lowerQuery) ||
        entry.number?.includes(query)
      ) {
        results.push(wrapper);
      }
    }

    return results;
  }

  /**
   * Get cached roster (no network request)
   */
  getCachedRoster(): RosterEntryWrapper[] {
    return Array.from(this.rosterCache.values());
  }

  /**
   * Clear roster cache
   */
  clearCache(): void {
    this.rosterCache.clear();
  }

  /**
   * Update internal cache from roster data
   */
  private updateCache(rosterData: RosterResponse | RosterData): void {
    this.rosterCache.clear();

    // Handle array format (real JMRI server) - store wrapped entries
    if (Array.isArray(rosterData)) {
      for (const wrapper of rosterData) {
        if (wrapper.type === 'rosterEntry' && wrapper.data) {
          this.rosterCache.set(wrapper.data.name, wrapper);
        }
      }
    }
    // Handle legacy keyed object format (for backward compatibility) - wrap entries
    else {
      let id = 1;
      for (const [name, entry] of Object.entries(rosterData)) {
        const wrapper: RosterEntryWrapper = {
          type: 'rosterEntry',
          data: entry,
          id: id++
        };
        this.rosterCache.set(name, wrapper);
      }
    }
  }
}
