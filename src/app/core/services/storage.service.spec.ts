import { StorageService } from './storage.service';
import { NgZone } from '@angular/core';

describe('StorageService', () => {
  let service: StorageService;
  let mockZone: NgZone;

  beforeEach(() => {
    localStorage.clear();
    mockZone = {
      run: (fn: any) => fn()
    } as unknown as NgZone;
    service = new StorageService(mockZone);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should store, retrieve, and delete items with prefix in localStorage mode', () => {
    service.setItem('testKey', { message: 'hello' });

    // Internal localStorage should have the prefix
    const raw = localStorage.getItem('holamotor_testKey');
    expect(raw).toBe(JSON.stringify({ message: 'hello' }));

    // getItem should unwrap and parse
    const retrieved = service.getItem<{ message: string }>('testKey');
    expect(retrieved).toEqual({ message: 'hello' });

    // removeItem
    service.removeItem('testKey');
    expect(service.getItem('testKey')).toBeNull();
  });

  it('should emit changed key through changes$ subject on set and remove', (done) => {
    let callCount = 0;
    service.changes$.subscribe((key) => {
      callCount++;
      if (callCount === 1) {
        expect(key).toBe('itemA');
      } else if (callCount === 2) {
        expect(key).toBe('itemA');
        done();
      }
    });

    service.setItem('itemA', 123);
    service.removeItem('itemA');
  });

  it('should clear all items with prefix', () => {
    service.setItem('key1', 'val1');
    service.setItem('key2', 'val2');
    localStorage.setItem('unrelated_key', 'keepMe');

    service.clear();

    expect(service.getItem('key1')).toBeNull();
    expect(service.getItem('key2')).toBeNull();
    expect(localStorage.getItem('unrelated_key')).toBe('keepMe');
  });

  it('should export all collections excluding device-specific keys', () => {
    service.setItem('orders', [{ id: 1 }]);
    service.setItem('lang', 'es'); // deviceKey

    const exported = service.exportAll();
    expect(exported['orders']).toEqual([{ id: 1 }]);
    expect(exported['lang']).toBeUndefined();
  });
});
