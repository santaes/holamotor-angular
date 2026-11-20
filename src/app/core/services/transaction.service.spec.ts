import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    service = new TransactionService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addVersion', () => {
    it('should set version to 1 when entity has no version', () => {
      const entity = { id: 1, nombre: 'Test' };
      const versioned = service.addVersion(entity);
      expect(versioned.version).toBe(1);
    });

    it('should increment existing version', () => {
      const entity = { id: 1, version: 3 };
      const versioned = service.addVersion(entity);
      expect(versioned.version).toBe(4);
    });

    it('should add lastModified timestamp', () => {
      const before = Date.now();
      const entity = { id: 1 };
      const versioned = service.addVersion(entity);
      const after = Date.now();
      expect(versioned.lastModified).toBeDefined();
      const ts = new Date(versioned.lastModified as any).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it('should not mutate the original entity', () => {
      const entity = { id: 1, version: 2 };
      service.addVersion(entity);
      expect(entity.version).toBe(2); // unchanged
    });
  });

  describe('checkVersion', () => {
    it('should return true when versions match', () => {
      const entity = { id: 1, version: 5 };
      expect(service.checkVersion(entity, 5)).toBe(true);
    });

    it('should return false when versions differ', () => {
      const entity = { id: 1, version: 5 };
      expect(service.checkVersion(entity, 4)).toBe(false);
    });

    it('should return false when entity has no version and expected is non-zero', () => {
      const entity = { id: 1 };
      expect(service.checkVersion(entity, 1)).toBe(false);
    });

    it('should return true when both are undefined/0', () => {
      const entity = { id: 1 };
      expect(service.checkVersion(entity, 0)).toBe(false); // undefined !== 0
    });
  });
});
