import { MessageQueue } from '../../../src/core/message-queue';
import { JmriMessage } from '../../../src/types/jmri-messages';

describe('MessageQueue', () => {
  let queue: MessageQueue;

  beforeEach(() => {
    queue = new MessageQueue(5);
  });

  describe('enqueue', () => {
    it('should add messages to queue', () => {
      const msg1: JmriMessage = { type: 'power' };
      const msg2: JmriMessage = { type: 'roster', method: 'list' };

      queue.enqueue(msg1);
      expect(queue.size()).toBe(1);

      queue.enqueue(msg2);
      expect(queue.size()).toBe(2);
    });

    it('should remove oldest message when queue is full', () => {
      const messages: JmriMessage[] = [
        { type: 'power', id: 1 },
        { type: 'power', id: 2 },
        { type: 'power', id: 3 },
        { type: 'power', id: 4 },
        { type: 'power', id: 5 },
        { type: 'power', id: 6 }
      ];

      messages.forEach(msg => queue.enqueue(msg));

      expect(queue.size()).toBe(5);
      const flushed = queue.flush();
      expect(flushed[0].id).toBe(2); // ID 1 was removed
      expect(flushed[flushed.length - 1].id).toBe(6);
    });
  });

  describe('flush', () => {
    it('should return all messages and clear queue', () => {
      const msg1: JmriMessage = { type: 'power', id: 1 };
      const msg2: JmriMessage = { type: 'power', id: 2 };

      queue.enqueue(msg1);
      queue.enqueue(msg2);

      const flushed = queue.flush();
      expect(flushed).toHaveLength(2);
      expect(flushed[0]).toEqual(msg1);
      expect(flushed[1]).toEqual(msg2);
      expect(queue.size()).toBe(0);
    });

    it('should return empty array when queue is empty', () => {
      const flushed = queue.flush();
      expect(flushed).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all messages without returning them', () => {
      queue.enqueue({ type: 'power' });
      queue.enqueue({ type: 'power' });

      expect(queue.size()).toBe(2);
      queue.clear();
      expect(queue.size()).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('should return true when queue is empty', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false when queue has messages', () => {
      queue.enqueue({ type: 'power' });
      expect(queue.isEmpty()).toBe(false);
    });
  });

  describe('isFull', () => {
    it('should return true when queue is at max size', () => {
      for (let i = 0; i < 5; i++) {
        queue.enqueue({ type: 'power' });
      }
      expect(queue.isFull()).toBe(true);
    });

    it('should return false when queue is not full', () => {
      queue.enqueue({ type: 'power' });
      expect(queue.isFull()).toBe(false);
    });
  });
});
