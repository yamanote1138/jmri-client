/**
 * Mock Response Manager
 * Generates mock JMRI responses for testing and demo purposes
 */

import { JmriMessage, PowerState, PowerMessage, ThrottleMessage, RosterMessage, HelloMessage, PongMessage, GoodbyeMessage } from '../types/jmri-messages.js';
import { mockData } from './mock-data.js';

export interface MockResponseManagerOptions {
  /**
   * Delay in milliseconds before returning responses (simulates network latency)
   * Set to 0 for instant responses
   */
  responseDelay?: number;

  /**
   * Current power state (used to track state changes)
   */
  initialPowerState?: PowerState;
}

/**
 * Manages mock responses for JMRI protocol
 */
export class MockResponseManager {
  private responseDelay: number;
  private powerState: PowerState;
  private throttles: Map<string, any> = new Map();

  constructor(options: MockResponseManagerOptions = {}) {
    this.responseDelay = options.responseDelay ?? 50;
    this.powerState = options.initialPowerState ?? PowerState.OFF;
  }

  /**
   * Get a mock response for a given message
   */
  async getMockResponse(message: JmriMessage): Promise<JmriMessage | null> {
    // Simulate network delay
    if (this.responseDelay > 0) {
      await this.delay(this.responseDelay);
    }

    // Route to appropriate handler based on message type
    switch (message.type) {
      case 'hello':
        return this.getHelloResponse();

      case 'power':
        return this.getPowerResponse(message);

      case 'roster':
        return this.getRosterResponse(message);

      case 'throttle':
        return this.getThrottleResponse(message);

      case 'ping':
        return this.getPingResponse();

      case 'goodbye':
        return this.getGoodbyeResponse();

      default:
        return null;
    }
  }

  /**
   * Get hello response (connection establishment)
   */
  private getHelloResponse(): HelloMessage {
    return JSON.parse(JSON.stringify(mockData.hello));
  }

  /**
   * Get power response
   */
  private getPowerResponse(message: JmriMessage): PowerMessage {
    // Handle power state change
    if (message.data?.state !== undefined) {
      this.powerState = message.data.state;
      return {
        type: 'power',
        data: { state: this.powerState }
      };
    }

    // Return current power state
    return {
      type: 'power',
      data: { state: this.powerState }
    };
  }

  /**
   * Get roster response
   */
  private getRosterResponse(message: JmriMessage): RosterMessage {
    if (message.type === 'roster' && message.method === 'list') {
      return JSON.parse(JSON.stringify(mockData.roster.list));
    }

    return {
      type: 'roster',
      method: 'list',
      data: {}
    };
  }

  /**
   * Get throttle response
   */
  private getThrottleResponse(message: JmriMessage): ThrottleMessage {
    const data = message.data || {};

    // Acquire throttle
    if (data.address !== undefined && !data.throttle) {
      const throttleId = data.name || `MOCK-${data.address}`;
      const throttleState = {
        throttle: throttleId,
        address: data.address,
        speed: 0,
        forward: true,
        F0: false,
        F1: false,
        F2: false,
        F3: false,
        F4: false
      };

      this.throttles.set(throttleId, throttleState);

      return {
        type: 'throttle',
        data: { ...throttleState }
      };
    }

    // Release throttle
    if (data.release !== undefined && data.throttle) {
      this.throttles.delete(data.throttle);
      return {
        type: 'throttle',
        data: {}
      };
    }

    // Throttle control (speed, direction, functions)
    if (data.throttle) {
      const throttleState = this.throttles.get(data.throttle);

      if (!throttleState) {
        // Throttle not found - this shouldn't normally happen in mock mode
        // but we'll create it on the fly
        const newState = {
          throttle: data.throttle,
          address: 0,
          speed: 0,
          forward: true
        };
        this.throttles.set(data.throttle, newState);
        return {
          type: 'throttle',
          data: { ...newState }
        };
      }

      // Update throttle state
      if (data.speed !== undefined) {
        throttleState.speed = data.speed;
      }
      if (data.forward !== undefined) {
        throttleState.forward = data.forward;
      }

      // Update function keys
      for (let i = 0; i <= 28; i++) {
        const key = `F${i}`;
        if (data[key] !== undefined) {
          throttleState[key] = data[key];
        }
      }

      // Return updated state (no response for throttle control commands)
      return {
        type: 'throttle',
        data: {}
      };
    }

    return {
      type: 'throttle',
      data: {}
    };
  }

  /**
   * Get ping response (pong)
   */
  private getPingResponse(): PongMessage {
    return JSON.parse(JSON.stringify(mockData.pong));
  }

  /**
   * Get goodbye response
   */
  private getGoodbyeResponse(): GoodbyeMessage {
    return JSON.parse(JSON.stringify(mockData.goodbye));
  }

  /**
   * Get current power state
   */
  getPowerState(): PowerState {
    return this.powerState;
  }

  /**
   * Set power state (for testing)
   */
  setPowerState(state: PowerState): void {
    this.powerState = state;
  }

  /**
   * Get all throttles (for testing)
   */
  getThrottles(): Map<string, any> {
    return this.throttles;
  }

  /**
   * Reset all state (for testing)
   */
  reset(): void {
    this.powerState = PowerState.OFF;
    this.throttles.clear();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for shared use across tests
 */
export const mockResponseManager = new MockResponseManager({ responseDelay: 0 });
