import { BillingService } from './billing.service';
import { StorageService } from '../../../core/services/storage.service';
import { VerifactuService } from '../../../core/services/verifactu.service';
import { Invoice, Quote } from '../models/billing.model';
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

describe('BillingService', () => {
  let service: BillingService;
  let mockStorage: MockStorageService;
  let mockVerifactu: any;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    mockVerifactu = {};
    service = new BillingService(
      mockStorage as unknown as StorageService,
      mockVerifactu as unknown as VerifactuService
    );
  });

  const createSampleInvoice = (): Invoice => ({
    numeroFactura: 'FAC-2026-001',
    clienteId: 1,
    clienteNombre: 'Laura Perez',
    fechaEmision: new Date(),
    fechaVencimiento: new Date(Date.now() + 86400000 * 30),
    estado: 'Enviada',
    subtotal: 100,
    impuestos: 21,
    descuento: 0,
    total: 121,
    items: [
      {
        id: 1,
        descripcion: 'Cambio de neumáticos',
        cantidad: 2,
        precioUnitario: 50,
        subtotal: 100
      }
    ],
    pagos: []
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create and retrieve an invoice', async () => {
    const inv = createSampleInvoice();
    const created = await firstValueFrom(service.createInvoice(inv));

    expect(created.id).toBeDefined();
    expect(created.total).toBe(121);

    const found = await firstValueFrom(service.getInvoiceById(created.id!));
    expect(found.numeroFactura).toBe('FAC-2026-001');
  });

  it('should update and delete invoices', async () => {
    const inv = createSampleInvoice();
    const created = await firstValueFrom(service.createInvoice(inv));

    const updated = await firstValueFrom(
      service.updateInvoiceStatus(created.id!, 'Cancelada')
    );
    expect(updated.estado).toBe('Cancelada');

    await firstValueFrom(service.deleteInvoice(created.id!));
    expect(() => service.getInvoiceById(created.id!)).toThrow('Invoice not found');
  });

  it('should add payment and automatically transition invoice to Pagada when fully paid', async () => {
    const inv = createSampleInvoice();
    const created = await firstValueFrom(service.createInvoice(inv));

    // Partial payment
    const partial = await firstValueFrom(
      service.addPayment(created.id!, {
        monto: 50,
        metodo: 'Tarjeta',
        fecha: new Date()
      })
    );
    expect(partial.estado).toBe('Enviada');
    expect(partial.pagos?.length).toBe(1);

    // Completing the payment
    const completed = await firstValueFrom(
      service.addPayment(created.id!, {
        monto: 71,
        metodo: 'Efectivo',
        fecha: new Date()
      })
    );
    expect(completed.estado).toBe('Pagada');
    expect(completed.pagos?.length).toBe(2);
  });

  it('should manage quotes (create, update, delete)', async () => {
    const quote: Quote = {
      numeroPresupuesto: 'PRE-2026-001',
      clienteId: 1,
      clienteNombre: 'Laura Perez',
      fechaEmision: new Date(),
      fechaValidoHasta: new Date(Date.now() + 86400000 * 15),
      estado: 'Pendiente',
      subtotal: 200,
      impuestos: 42,
      descuento: 10,
      total: 232,
      items: [
        {
          id: 1,
          descripcion: 'Pintura de paragolpes',
          cantidad: 1,
          precioUnitario: 200,
          subtotal: 200
        }
      ]
    };

    const createdQuote = await firstValueFrom(service.createQuote(quote));
    expect(createdQuote.id).toBeDefined();

    const updatedQuote = await firstValueFrom(
      service.updateQuoteStatus(createdQuote.id!, 'Aprobado')
    );
    expect(updatedQuote.estado).toBe('Aprobado');

    const foundQuote = await firstValueFrom(service.getQuoteById(createdQuote.id!));
    expect(foundQuote.total).toBe(232);
  });

  it('should convert approved quote to an invoice', async () => {
    const quote: Quote = {
      numeroPresupuesto: 'PRE-2026-002',
      clienteId: 5,
      clienteNombre: 'Marcos Alonso',
      fechaEmision: new Date(),
      fechaValidoHasta: new Date(),
      estado: 'Aprobado',
      subtotal: 300,
      impuestos: 63,
      descuento: 0,
      total: 363,
      items: [
        {
          id: 1,
          descripcion: 'Embrague',
          cantidad: 1,
          precioUnitario: 300,
          subtotal: 300
        }
      ]
    };

    const createdQuote = await firstValueFrom(service.createQuote(quote));
    const convertedInvoice = await firstValueFrom(service.convertQuoteToInvoice(createdQuote.id!));

    expect(convertedInvoice.id).toBeDefined();
    expect(convertedInvoice.clienteId).toBe(5);
    expect(convertedInvoice.total).toBe(363);
    expect(convertedInvoice.estado).toBe('Enviada');
    expect(convertedInvoice.numeroFactura).toContain('FAC-');
  });
});
