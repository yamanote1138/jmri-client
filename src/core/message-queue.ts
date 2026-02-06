/**
 * Message queue for offline message handling
 */

import { JmriMessage } from '../types/jmri-messages';

/**
 * Queue for storing messages when disconnected
 * Messages are sent when connection is restored
 */
export class MessageQueue {
  private queue: JmriMessage[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Add message to queue
   * If queue is full, oldest message is removed
   */
  enqueue(message: JmriMessage): void {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // Remove oldest
    }
    this.queue.push(message);
  }

  /**
   * Get all queued messages and clear queue
   */
  flush(): JmriMessage[] {
    const messages = [...this.queue];
    this.queue = [];
    return messages;
  }

  /**
   * Clear all queued messages without returning them
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get number of queued messages
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Check if queue is full
   */
  isFull(): boolean {
    return this.queue.length >= this.maxSize;
  }
}
