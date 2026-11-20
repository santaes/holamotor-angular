import { DiagnosisService } from './diagnosis.service';
import { StorageService } from '../../../core/services/storage.service';
import { CarDiagnosis } from '../models/diagnosis.model';
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

describe('DiagnosisService', () => {
  let service: DiagnosisService;
  let mockStorage: MockStorageService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    service = new DiagnosisService(mockStorage as unknown as StorageService);
  });

  const createSampleDiagnosis = (): CarDiagnosis => ({
    fecha: new Date(),
    kilometraje: 85000,
    sintomasCliente: 'Ruidos metálicos al frenar',
    diagnosticoMecanico: 'Pastillas de freno desgastadas al 90%',
    gravedad: 'Alta',
    estado: 'Pendiente',
    codigosOBD: ['B0001'],
    estimacionCoste: 180,
    estimacionTiempo: '2 horas'
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create and retrieve a diagnosis', async () => {
    const diag = createSampleDiagnosis();
    const created = await firstValueFrom(service.createDiagnosis(diag));

    expect(created.id).toBeDefined();
    expect(created.gravedad).toBe('Alta');

    const found = await firstValueFrom(service.getDiagnosisById(created.id!));
    expect(found.sintomasCliente).toBe('Ruidos metálicos al frenar');
  });

  it('should update and delete a diagnosis', async () => {
    const diag = createSampleDiagnosis();
    const created = await firstValueFrom(service.createDiagnosis(diag));

    const updated = await firstValueFrom(
      service.updateDiagnosis(created.id!, { ...created, estado: 'Completado' })
    );
    expect(updated.estado).toBe('Completado');

    await firstValueFrom(service.deleteDiagnosis(created.id!));
    expect(() => service.getDiagnosisById(created.id!)).toThrow('Diagnosis not found');
  });

  it('should filter diagnoses by client and vehicle', async () => {
    const diag1 = { ...createSampleDiagnosis(), clienteId: 10, vehiculoId: 20 };
    const diag2 = { ...createSampleDiagnosis(), clienteId: 10, vehiculoId: 21 };
    const diag3 = { ...createSampleDiagnosis(), clienteId: 11, vehiculoId: 30 };

    await firstValueFrom(service.createDiagnosis(diag1));
    await firstValueFrom(service.createDiagnosis(diag2));
    await firstValueFrom(service.createDiagnosis(diag3));

    const clientDiagnoses = await firstValueFrom(service.getDiagnosesByClient(10));
    expect(clientDiagnoses.length).toBe(2);

    const vehicleDiagnoses = await firstValueFrom(service.getDiagnosesByVehicle(20));
    expect(vehicleDiagnoses.length).toBe(1);
    expect(vehicleDiagnoses[0].vehiculoId).toBe(20);
  });

  it('should assign diagnosis to client and vehicle', async () => {
    const diag = createSampleDiagnosis();
    const created = await firstValueFrom(service.createDiagnosis(diag));

    const assignedClient = await firstValueFrom(service.assignToClient(created.id!, 42, 'Antonio Banderas'));
    expect(assignedClient.clienteId).toBe(42);
    expect(assignedClient.clienteNombre).toBe('Antonio Banderas');

    const assignedVehicle = await firstValueFrom(service.assignToVehicle(created.id!, 99, 'Seat Ibiza 2019'));
    expect(assignedVehicle.vehiculoId).toBe(99);
    expect(assignedVehicle.vehiculoInfo).toBe('Seat Ibiza 2019');
  });
});
