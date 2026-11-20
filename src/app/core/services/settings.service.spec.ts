import { SettingsService, DEFAULT_SETTINGS } from './settings.service';
import { StorageService } from './storage.service';
import { Subject, firstValueFrom } from 'rxjs';

class MockStorageService {
  private data: Record<string, any> = {};
  readonly changes$ = new Subject<string>();
  readonly remoteChanges$ = new Subject<string>();

  getItem<T>(key: string): T | null {
    const val = this.data[key];
    return val !== undefined ? JSON.parse(JSON.stringify(val)) : null;
  }

  setItem<T>(key: string, value: T): void {
    this.data[key] = JSON.parse(JSON.stringify(value));
    this.changes$.next(key);
  }

  removeItem(key: string): void {
    delete this.data[key];
    this.changes$.next(key);
  }

  clear(): void {
    this.data = {};
  }
}

describe('SettingsService', () => {
  let service: SettingsService;
  let mockStorage: MockStorageService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    service = new SettingsService(mockStorage as unknown as StorageService);
  });

  it('should initialize with default settings when storage is empty', () => {
    expect(service.value.currency).toBe('EUR');
    expect(service.value.taxRate).toBe(21);
    expect(service.value.appointmentDuration).toBe(60);
    expect(service.value.notifyStock).toBe(true);
  });

  it('should save partial settings and update current value', () => {
    service.save({
      workshopName: 'Taller HolaMotor Central',
      phone: '912345678',
      taxRate: 21
    });

    expect(service.value.workshopName).toBe('Taller HolaMotor Central');
    expect(service.value.phone).toBe('912345678');
    expect(service.value.currency).toBe('EUR'); // unchanged
  });

  it('should emit updated settings via settings$ observable', async () => {
    service.save({ email: 'taller@holamotor.com' });
    const current = await firstValueFrom(service.settings$);
    expect(current.email).toBe('taller@holamotor.com');
  });
});
