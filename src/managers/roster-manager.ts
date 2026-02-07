/**
 * Roster management
 */

import { WebSocketClient } from '../core/websocket-client.js';
import { RosterMessage, RosterEntry, RosterData } from '../types/jmri-messages.js';

/**
 * Manages locomotive roster
 */
export class RosterManager {
  private client: WebSocketClient;
  private rosterCache: Map<string, RosterEntry> = new Map();

  constructor(client: WebSocketClient) {
    this.client = client;
  }

  /**
   * Get all roster entries
   */
  async getRoster(): Promise<RosterEntry[]> {
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
  async getRosterEntryByName(name: string): Promise<RosterEntry | undefined> {
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
  async getRosterEntryByAddress(address: string | number): Promise<RosterEntry | undefined> {
    // Ensure roster is loaded
    if (this.rosterCache.size === 0) {
      await this.getRoster();
    }

    const addressStr = address.toString();

    for (const entry of this.rosterCache.values()) {
      if (entry.address === addressStr) {
        return entry;
      }
    }

    return undefined;
  }

  /**
   * Search roster by partial name match
   */
  async searchRoster(query: string): Promise<RosterEntry[]> {
    // Ensure roster is loaded
    if (this.rosterCache.size === 0) {
      await this.getRoster();
    }

    const lowerQuery = query.toLowerCase();
    const results: RosterEntry[] = [];

    for (const entry of this.rosterCache.values()) {
      if (
        entry.name.toLowerCase().includes(lowerQuery) ||
        entry.address.includes(query) ||
        entry.road?.toLowerCase().includes(lowerQuery) ||
        entry.number?.includes(query)
      ) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Get cached roster (no network request)
   */
  getCachedRoster(): RosterEntry[] {
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
  private updateCache(rosterData: RosterData): void {
    this.rosterCache.clear();

    for (const [name, entry] of Object.entries(rosterData)) {
      this.rosterCache.set(name, entry);
    }
  }
}
