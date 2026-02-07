/**
 * Message ID generator for request/response correlation
 */

/**
 * Sequential message ID generator
 * Provides unique IDs for correlating requests and responses
 */
export class MessageIdGenerator {
  private currentId: number = 0;
  private readonly maxId: number = Number.MAX_SAFE_INTEGER;

  /**
   * Generate next sequential ID
   * Wraps around at MAX_SAFE_INTEGER
   */
  next(): number {
    this.currentId++;
    if (this.currentId >= this.maxId) {
      this.currentId = 1;
    }
    return this.currentId;
  }

  /**
   * Reset ID counter to 0
   */
  reset(): void {
    this.currentId = 0;
  }

  /**
   * Get current ID without incrementing
   */
  current(): number {
    return this.currentId;
  }
}
