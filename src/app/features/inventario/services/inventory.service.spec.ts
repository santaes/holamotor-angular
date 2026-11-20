import { InventoryService } from './inventory.service';
import { StorageService } from '../../../core/services/storage.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { InventoryItem, Supplier } from '../models/inventory.model';
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

describe('InventoryService', () => {
  let service: InventoryService;
  let mockStorage: MockStorageService;
  let transactionService: TransactionService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    transactionService = new TransactionService();
    service = new InventoryService(
      mockStorage as unknown as StorageService,
      transactionService
    );
  });

  const createSampleItem = (): InventoryItem => ({
    codigo: 'FIL-001',
    nombre: 'Filtro de Aceite Bosch',
    categoria: 'Filtros',
    cantidad: 15,
    cantidadMinima: 5,
    precioCompra: 8.5,
    precioVenta: 18.0,
    ubicacion: 'Estantería A-2',
    proveedorId: 1,
    fechaActualizacion: new Date()
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate required fields and non-negative values when creating item', async () => {
    const invalid = {
      nombre: '',
      codigo: 'ABC',
      cantidad: -5,
      precioCompra: 10,
      precioVenta: 20
    } as any;

    await expect(firstValueFrom(service.createInventoryItem(invalid))).rejects.toThrow(
      'Nombre, código, cantidad y precios son requeridos y deben ser válidos'
    );
  });

  it('should create and retrieve inventory item', async () => {
    const item = createSampleItem();
    const created = await firstValueFrom(service.createInventoryItem(item));

    expect(created.id).toBeDefined();
    expect(created.codigo).toBe('FIL-001');

    const found = await firstValueFrom(service.getInventoryItemById(created.id!));
    expect(found.nombre).toBe('Filtro de Aceite Bosch');
  });

  it('should detect low stock items when cantidad <= cantidadMinima', async () => {
    const normalItem = createSampleItem();
    const lowStockItem: InventoryItem = {
      ...createSampleItem(),
      codigo: 'ACE-002',
      nombre: 'Aceite 5W30',
      cantidad: 3,
      cantidadMinima: 10
    };

    await firstValueFrom(service.createInventoryItem(normalItem));
    await firstValueFrom(service.createInventoryItem(lowStockItem));

    const lowStock = await firstValueFrom(service.getLowStockItems());
    expect(lowStock.length).toBe(1);
    expect(lowStock[0].codigo).toBe('ACE-002');
  });

  it('should search inventory items by name or code', async () => {
    const item1 = createSampleItem();
    const item2: InventoryItem = {
      ...createSampleItem(),
      codigo: 'PAS-999',
      nombre: 'Pastillas Brembo'
    };

    await firstValueFrom(service.createInventoryItem(item1));
    await firstValueFrom(service.createInventoryItem(item2));

    const searchByName = await firstValueFrom(service.searchInventoryItems('Brembo'));
    expect(searchByName.length).toBe(1);
    expect(searchByName[0].codigo).toBe('PAS-999');

    const searchByCode = await firstValueFrom(service.searchInventoryItems('FIL'));
    expect(searchByCode.length).toBe(1);
    expect(searchByCode[0].nombre).toContain('Bosch');
  });

  it('should update stock with optimistic locking and reject negative quantities', async () => {
    const item = createSampleItem();
    const created = await firstValueFrom(service.createInventoryItem(item));

    // Reject negative quantity
    await expect(firstValueFrom(service.updateStock(created.id!, -2))).rejects.toThrow(
      'La cantidad no puede ser negativa'
    );

    // Valid stock update — no version passed (skips optimistic lock check)
    const updated = await firstValueFrom(service.updateStock(created.id!, 25));
    expect(updated.cantidad).toBe(25);
    expect(updated.version).toBe(1); // addVersion bumps from undefined(0) to 1

    // Stale version update rejected (expected=0, actual=1)
    await expect(firstValueFrom(service.updateStock(created.id!, 30, 0))).rejects.toThrow(
      'El item ha sido modificado por otro usuario'
    );
  });

  it('should manage suppliers (create, retrieve, update)', async () => {
    const supplier: Supplier = {
      nombre: 'AutoRecambios Express',
      contacto: 'Pedro Martin',
      telefono: '911223344',
      email: 'pedro@autorecambios.es',
      direccion: 'Poligono Industrial 4',
      ciudad: 'Madrid',
      codigoPostal: '28800',
      diasEntrega: 2,
      activo: true
    };

    const createdSupplier = await firstValueFrom(service.createSupplier(supplier));
    expect(createdSupplier.id).toBeDefined();

    const foundSupplier = await firstValueFrom(service.getSupplierById(createdSupplier.id!));
    expect(foundSupplier.nombre).toBe('AutoRecambios Express');

    const updatedSupplier = await firstValueFrom(
      service.updateSupplier(createdSupplier.id!, { ...foundSupplier, diasEntrega: 1 })
    );
    expect(updatedSupplier.diasEntrega).toBe(1);
  });
});
