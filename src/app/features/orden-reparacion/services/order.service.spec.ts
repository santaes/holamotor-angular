import { OrderService } from './order.service';
import { StorageService } from '../../../core/services/storage.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { RepairOrder } from '../models/order.model';
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

describe('OrderService', () => {
  let service: OrderService;
  let mockStorage: MockStorageService;
  let transactionService: TransactionService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    transactionService = new TransactionService();
    service = new OrderService(
      mockStorage as unknown as StorageService,
      transactionService
    );
  });

  const createSampleOrder = (): RepairOrder => ({
    numeroOrden: 'ORD-2026-001',
    clienteId: 10,
    clienteNombre: 'Sofia Hernandez',
    vehiculoId: 20,
    vehiculoInfo: 'Renault Megane 2017',
    fechaEntrada: new Date(),
    estado: 'Presupuesto',
    prioridad: 'Media',
    descripcionProblema: 'Fallo intermitente en arranque',
    kilometrajeEntrada: 120000,
    nivelCombustible: '1/2',
    elementos: [],
    manoDeObra: [],
    subtotal: 0,
    impuestos: 0,
    total: 0,
    version: 1
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate required fields when creating a repair order', async () => {
    const invalid = { clienteId: 0 } as any;
    await expect(firstValueFrom(service.createOrder(invalid))).rejects.toThrow(
      'Cliente, vehículo y descripción del problema son requeridos'
    );
  });

  it('should create and retrieve a repair order', async () => {
    const order = createSampleOrder();
    const created = await firstValueFrom(service.createOrder(order));

    expect(created.id).toBeDefined();
    expect(created.numeroOrden).toBe('ORD-2026-001');

    const found = await firstValueFrom(service.getOrderById(created.id!));
    expect(found.descripcionProblema).toBe('Fallo intermitente en arranque');
  });

  it('should transition through order statuses', async () => {
    const order = createSampleOrder();
    const created = await firstValueFrom(service.createOrder(order));

    const approved = await firstValueFrom(service.updateOrderStatus(created.id!, 'Aprobada'));
    expect(approved.estado).toBe('Aprobada');

    const inProgress = await firstValueFrom(service.updateOrderStatus(created.id!, 'En Reparación'));
    expect(inProgress.estado).toBe('En Reparación');

    const finished = await firstValueFrom(service.updateOrderStatus(created.id!, 'Terminada'));
    expect(finished.estado).toBe('Terminada');

    const delivered = await firstValueFrom(service.updateOrderStatus(created.id!, 'Entregada'));
    expect(delivered.estado).toBe('Entregada');
  });

  it('should support optimistic locking when updating an order', async () => {
    const order = createSampleOrder();
    const created = await firstValueFrom(service.createOrder(order));

    const updated = await firstValueFrom(
      service.updateOrder(created.id!, { ...created, prioridad: 'Alta' }, 1)
    );
    expect(updated.prioridad).toBe('Alta');
    expect(updated.version).toBe(2);

    // Stale version should reject
    await expect(
      firstValueFrom(service.updateOrder(created.id!, { ...updated, prioridad: 'Baja' }, 1))
    ).rejects.toThrow('La orden ha sido modificada por otro usuario');
  });

  it('should delete a repair order', async () => {
    const order = createSampleOrder();
    const created = await firstValueFrom(service.createOrder(order));

    await firstValueFrom(service.deleteOrder(created.id!));
    expect(() => service.getOrderById(created.id!)).toThrow('Order not found');
  });
});
