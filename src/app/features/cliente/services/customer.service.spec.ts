import { CustomerService } from './customer.service';
import { StorageService } from '../../../core/services/storage.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Customer, Vehicle } from '../models/customer.model';
import { Subject, of, firstValueFrom } from 'rxjs';

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

describe('CustomerService', () => {
  let service: CustomerService;
  let mockStorage: MockStorageService;
  let mockAppointmentService: any;
  let mockOrderService: any;
  let mockDiagnosisService: any;
  let transactionService: TransactionService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    mockAppointmentService = {
      getAppointmentsByCustomer: jest.fn().mockReturnValue(of([])),
      deleteAppointment: jest.fn().mockReturnValue(of(void 0))
    };
    mockOrderService = {
      getOrdersByCustomer: jest.fn().mockReturnValue(of([])),
      deleteOrder: jest.fn().mockReturnValue(of(void 0))
    };
    mockDiagnosisService = {
      getDiagnosesByClient: jest.fn().mockReturnValue(of([])),
      deleteDiagnosis: jest.fn().mockReturnValue(of(void 0))
    };
    transactionService = new TransactionService();

    service = new CustomerService(
      mockStorage as unknown as StorageService,
      mockAppointmentService,
      mockOrderService,
      mockDiagnosisService,
      transactionService
    );
  });

  const createSampleCustomer = (): Customer => ({
    nombre: 'Juan',
    apellido: 'Perez',
    email: 'juan.perez@example.com',
    telefono: '612345678',
    direccion: 'Calle Mayor 10',
    ciudad: 'Madrid',
    codigoPostal: '28001',
    fechaRegistro: new Date(),
    lealtadPuntos: 0,
    nivelLealtad: 'Bronce',
    estado: 'Activo',
    vehiculos: []
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate required fields when creating a customer', async () => {
    const invalid = { nombre: '' } as any;
    await expect(firstValueFrom(service.createCustomer(invalid))).rejects.toThrow(
      'Nombre, apellido, email y teléfono son requeridos'
    );
  });

  it('should validate email format', async () => {
    const customer = createSampleCustomer();
    customer.email = 'not-an-email';
    await expect(firstValueFrom(service.createCustomer(customer))).rejects.toThrow('Email inválido');
  });

  it('should validate phone format', async () => {
    const customer = createSampleCustomer();
    customer.telefono = 'abc';
    await expect(firstValueFrom(service.createCustomer(customer))).rejects.toThrow('Teléfono inválido');
  });

  it('should create customer and assign id', async () => {
    const customer = createSampleCustomer();
    const created = await firstValueFrom(service.createCustomer(customer));

    expect(created.id).toBeDefined();
    expect(created.nombre).toBe('Juan');
    expect(created.apellido).toBe('Perez');

    const found = await firstValueFrom(service.getCustomerById(created.id!));
    expect(found.id).toBe(created.id);
  });

  it('should update customer details and enforce optimistic locking', async () => {
    const customer = createSampleCustomer();
    const created = await firstValueFrom(service.createCustomer(customer));

    const updated = await firstValueFrom(
      service.updateCustomer(created.id!, { ...created, direccion: 'Avenida Sol 42' }, created.version)
    );
    expect(updated.direccion).toBe('Avenida Sol 42');
    expect(updated.version).toBeGreaterThan(created.version || 0);

    // Mismatched version
    await expect(
      firstValueFrom(service.updateCustomer(created.id!, { ...updated, direccion: 'New address' }, 999))
    ).rejects.toThrow('El cliente ha sido modificado por otro usuario');
  });

  it('should manage vehicles for customer (add, update, delete)', async () => {
    const customer = createSampleCustomer();
    const created = await firstValueFrom(service.createCustomer(customer));

    const vehicle: Vehicle = {
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2021,
      placa: '1234ABC',
      color: 'Azul',
      kilometraje: 0,
      clienteId: created.id!
    };

    const addedVehicle = await firstValueFrom(service.addVehicle(created.id!, vehicle));
    expect(addedVehicle.id).toBeDefined();
    expect(addedVehicle.marca).toBe('Toyota');

    const vehicles = await firstValueFrom(service.getCustomerVehicles(created.id!));
    expect(vehicles.length).toBe(1);
    expect(vehicles[0].placa).toBe('1234ABC');

    // Update vehicle
    const updatedVehicle = await firstValueFrom(
      service.updateVehicle(addedVehicle.id!, { ...addedVehicle, color: 'Blanco' })
    );
    expect(updatedVehicle.color).toBe('Blanco');

    // Delete vehicle
    await firstValueFrom(service.deleteVehicle(addedVehicle.id!));
    const emptyVehicles = await firstValueFrom(service.getCustomerVehicles(created.id!));
    expect(emptyVehicles.length).toBe(0);
  });

  it('should add loyalty points', async () => {
    const customer = createSampleCustomer();
    const created = await firstValueFrom(service.createCustomer(customer));

    const withPoints = await firstValueFrom(service.addLoyaltyPoints(created.id!, 150));
    expect(withPoints.lealtadPuntos).toBe(150);

    const withMorePoints = await firstValueFrom(service.addLoyaltyPoints(created.id!, 350));
    expect(withMorePoints.lealtadPuntos).toBe(500);
  });

  it('should search customers by name, email, or phone', async () => {
    const c1 = createSampleCustomer();
    const c2: Customer = {
      ...createSampleCustomer(),
      nombre: 'Ana',
      apellido: 'Lopez',
      email: 'ana.lopez@example.com',
      telefono: '698765432'
    };
    await firstValueFrom(service.createCustomer(c1));
    await firstValueFrom(service.createCustomer(c2));

    const byName = await firstValueFrom(service.searchCustomers('Ana'));
    expect(byName.length).toBe(1);
    expect(byName[0].nombre).toBe('Ana');

    const byPhone = await firstValueFrom(service.searchCustomers('612'));
    expect(byPhone.length).toBe(1);
    expect(byPhone[0].apellido).toBe('Perez');
  });

  it('should delete customer', async () => {
    const customer = createSampleCustomer();
    const created = await firstValueFrom(service.createCustomer(customer));
    await firstValueFrom(service.deleteCustomer(created.id!));

    expect(() => service.getCustomerById(created.id!)).toThrow('Customer not found');
  });
});
