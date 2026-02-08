/**
 * WebSocket Adapter
 * Provides a unified interface for WebSocket connections in both Node.js and browser environments
 */

import { EventEmitter } from 'eventemitter3';

/**
 * WebSocket adapter interface
 */
export interface WebSocketAdapter extends EventEmitter {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  readonly readyState: number;
}

/**
 * WebSocket ready states
 */
export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3
}

/**
 * Create a WebSocket adapter for the current environment
 */
export async function createWebSocketAdapter(url: string, protocols?: string | string[]): Promise<WebSocketAdapter> {
  // Detect environment
  const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';

  if (isBrowser) {
    return new BrowserWebSocketAdapter(url, protocols);
  } else {
    return await NodeWebSocketAdapter.create(url, protocols);
  }
}

/**
 * Browser WebSocket adapter
 * Wraps native browser WebSocket with EventEmitter interface
 */
class BrowserWebSocketAdapter extends EventEmitter implements WebSocketAdapter {
  private ws: WebSocket;

  constructor(url: string, protocols?: string | string[]) {
    super();

    this.ws = new WebSocket(url, protocols);

    this.ws.onopen = () => {
      this.emit('open');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.emit('message', event.data);
    };

    this.ws.onerror = () => {
      this.emit('error', new Error('WebSocket error'));
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.emit('close', event.code, event.reason);
    };
  }

  send(data: string): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }

  get readyState(): number {
    return this.ws.readyState;
  }
}

/**
 * Node.js WebSocket adapter
 * Wraps ws package with consistent interface
 */
class NodeWebSocketAdapter extends EventEmitter implements WebSocketAdapter {
  private ws: any;

  private constructor(ws: any) {
    super();
    this.ws = ws;

    this.ws.on('open', () => {
      this.emit('open');
    });

    this.ws.on('message', (data: any) => {
      // Convert Buffer to string if needed
      const message = typeof data === 'string' ? data : data.toString();
      this.emit('message', message);
    });

    this.ws.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.ws.on('close', (code: number, reason: string) => {
      this.emit('close', code, reason);
    });
  }

  static async create(url: string, protocols?: string | string[]): Promise<NodeWebSocketAdapter> {
    // Use dynamic import for ESM compatibility
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket(url, protocols);
    return new NodeWebSocketAdapter(ws);
  }

  send(data: string): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }

  get readyState(): number {
    return this.ws.readyState;
  }
}
