import { MessageIdGenerator } from '../../../src/utils/message-id';

describe('MessageIdGenerator', () => {
  let generator: MessageIdGenerator;

  beforeEach(() => {
    generator = new MessageIdGenerator();
  });

  describe('next()', () => {
    it('should generate sequential IDs starting from 1', () => {
      expect(generator.next()).toBe(1);
      expect(generator.next()).toBe(2);
      expect(generator.next()).toBe(3);
    });

    it('should generate unique IDs across multiple calls', () => {
      const ids = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        const id = generator.next();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
      expect(ids.size).toBe(1000);
    });

    it('should wrap around at MAX_SAFE_INTEGER', () => {
      // Set to near max
      const maxId = Number.MAX_SAFE_INTEGER;
      (generator as any).currentId = maxId - 2;

      expect(generator.next()).toBe(maxId - 1);
      expect(generator.next()).toBe(1); // Should wrap (>= maxId triggers reset)
    });
  });

  describe('current()', () => {
    it('should return current ID without incrementing', () => {
      expect(generator.current()).toBe(0);
      generator.next();
      expect(generator.current()).toBe(1);
      expect(generator.current()).toBe(1); // No increment
      generator.next();
      expect(generator.current()).toBe(2);
    });
  });

  describe('reset()', () => {
    it('should reset ID counter to 0', () => {
      generator.next();
      generator.next();
      generator.next();
      expect(generator.current()).toBe(3);

      generator.reset();
      expect(generator.current()).toBe(0);
      expect(generator.next()).toBe(1);
    });
  });
});
