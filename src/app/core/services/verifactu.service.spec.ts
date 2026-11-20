import { VerifactuService } from './verifactu.service';
import { SettingsService, AppSettings, DEFAULT_SETTINGS } from './settings.service';
import { of } from 'rxjs';

class MockSettingsService {
  private _value: AppSettings = { ...DEFAULT_SETTINGS };

  get value(): AppSettings {
    return this._value;
  }

  patch(patch: Partial<AppSettings>): void {
    this._value = { ...this._value, ...patch };
  }
}

describe('VerifactuService', () => {
  let service: VerifactuService;
  let mockSettings: MockSettingsService;
  let mockHttp: any;

  beforeEach(() => {
    mockSettings = new MockSettingsService();
    mockHttp = {
      post: jest.fn(),
      get: jest.fn()
    };
    service = new VerifactuService(
      mockHttp,
      mockSettings as unknown as SettingsService
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isConfigured()', () => {
    it('should return false when no taxId is set', () => {
      mockSettings.patch({ taxId: '' });
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when taxId is set but no certificate is loaded', () => {
      mockSettings.patch({ taxId: 'B12345678' });
      // No certificate loaded — still false
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('isSandboxMode()', () => {
    it('should return true by default (DEFAULT_SETTINGS has verifactuSandbox: true)', () => {
      expect(service.isSandboxMode()).toBe(true);
    });

    it('should return false when verifactuSandbox is false', () => {
      mockSettings.patch({ verifactuSandbox: false });
      expect(service.isSandboxMode()).toBe(false);
    });
  });

  describe('getCurrentMode()', () => {
    it('should return "Sandbox (Pruebas)" in sandbox mode', () => {
      mockSettings.patch({ verifactuSandbox: true });
      expect(service.getCurrentMode()).toBe('Sandbox (Pruebas)');
    });

    it('should return "Producción (AEAT)" when sandbox is off', () => {
      mockSettings.patch({ verifactuSandbox: false });
      expect(service.getCurrentMode()).toBe('Producción (AEAT)');
    });
  });

  describe('generateQRCode()', () => {
    it('should produce a base64-encoded string containing invoice fields', () => {
      const invoiceData = {
        IDEmisorFactura: 'B12345678',
        NumSerieFactura: 'FAC-2026-001',
        FechaExpedicionFactura: '2026-11-20',
        ImporteTotal: '363.00',
        firma: 'ABC123'
      };
      const qr = service.generateQRCode(invoiceData);

      // Should be valid base64
      expect(() => atob(qr)).not.toThrow();

      // Decoded should contain the joined fields
      const decoded = atob(qr);
      expect(decoded).toContain('B12345678');
      expect(decoded).toContain('FAC-2026-001');
      expect(decoded).toContain('2026-11-20');
      expect(decoded).toContain('363.00');
      expect(decoded).toContain('ABC123');
    });

    it('should use empty string for missing firma field', () => {
      const invoiceData = {
        IDEmisorFactura: 'X',
        NumSerieFactura: 'Y',
        FechaExpedicionFactura: 'Z',
        ImporteTotal: '0'
        // firma omitted
      };
      const qr = service.generateQRCode(invoiceData);
      const decoded = atob(qr);
      // Last segment should be empty (firma = '')
      expect(decoded.endsWith('|')).toBe(true);
    });
  });
});
