import { AppointmentService } from './appointment.service';
import { StorageService } from '../../../core/services/storage.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Subject, firstValueFrom } from 'rxjs';
import { Appointment } from '../models/appointment.model';

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

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockStorage: MockStorageService;
  let transactionService: TransactionService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    transactionService = new TransactionService();
    service = new AppointmentService(mockStorage as unknown as StorageService, transactionService);
  });

  const getFutureDate = (daysAhead: number = 1): Date => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d;
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate required fields when creating an appointment', async () => {
    const invalid = { clienteId: 0 } as any;
    await expect(firstValueFrom(service.createAppointment(invalid))).rejects.toThrow(
      'Cliente, fecha, hora de inicio y hora de fin son requeridos'
    );
  });

  it('should reject appointment if horaFin is before or equal to horaInicio', async () => {
    const appt: Appointment = {
      clienteId: 1,
      clienteNombre: 'Carlos Gomez',
      vehiculoId: 2,
      vehiculoInfo: 'Seat Leon 2020',
      fecha: getFutureDate(2),
      horaInicio: '14:00',
      horaFin: '13:00',
      duracionMinutos: 60,
      tipo: 'Mantenimiento',
      descripcion: 'Revisión periódica',
      estado: 'Programada',
      prioridad: 'Media',
      recordatorioEnviado: false,
      fechaCreacion: new Date()
    };

    await expect(firstValueFrom(service.createAppointment(appt))).rejects.toThrow(
      'La hora de fin debe ser posterior a la hora de inicio'
    );
  });

  it('should reject appointments scheduled in the past', async () => {
    const pastDate = new Date(2020, 0, 1);
    const appt: Appointment = {
      clienteId: 1,
      clienteNombre: 'Carlos Gomez',
      vehiculoId: 2,
      vehiculoInfo: 'Seat Leon 2020',
      fecha: pastDate,
      horaInicio: '10:00',
      horaFin: '11:00',
      duracionMinutos: 60,
      tipo: 'Mantenimiento',
      descripcion: 'Revisión pasada',
      estado: 'Programada',
      prioridad: 'Media',
      recordatorioEnviado: false,
      fechaCreacion: new Date()
    };

    await expect(firstValueFrom(service.createAppointment(appt))).rejects.toThrow(
      'La fecha de la cita no puede ser en el pasado'
    );
  });

  it('should detect time conflicts on the same date with overlapping hours', async () => {
    const futureDate = getFutureDate(5);
    const firstAppt: Appointment = {
      clienteId: 1,
      clienteNombre: 'Carlos Gomez',
      vehiculoId: 2,
      vehiculoInfo: 'Seat Leon 2020',
      fecha: futureDate,
      horaInicio: '10:00',
      horaFin: '11:00',
      duracionMinutos: 60,
      tipo: 'Mantenimiento',
      descripcion: 'Cambio de aceite',
      estado: 'Programada',
      prioridad: 'Media',
      recordatorioEnviado: false,
      fechaCreacion: new Date()
    };

    await firstValueFrom(service.createAppointment(firstAppt));

    // Overlapping appointment: 10:30 to 11:30
    const conflictingAppt: Appointment = {
      clienteId: 2,
      clienteNombre: 'Maria Lopez',
      vehiculoId: 3,
      vehiculoInfo: 'Ford Focus 2018',
      fecha: futureDate,
      horaInicio: '10:30',
      horaFin: '11:30',
      duracionMinutos: 60,
      tipo: 'Reparación',
      descripcion: 'Frenos',
      estado: 'Programada',
      prioridad: 'Alta',
      recordatorioEnviado: false,
      fechaCreacion: new Date()
    };

    await expect(firstValueFrom(service.createAppointment(conflictingAppt))).rejects.toThrow(
      'Existe un conflicto de horario con otra cita'
    );
  });

  it('should not conflict with appointments on different dates or cancelled appointments', async () => {
    const futureDate1 = getFutureDate(3);
    const futureDate2 = getFutureDate(4);

    const firstAppt: Appointment = {
      clienteId: 1,
      clienteNombre: 'Carlos Gomez',
      vehiculoId: 2,
      vehiculoInfo: 'Seat Leon 2020',
      fecha: futureDate1,
      horaInicio: '10:00',
      horaFin: '11:00',
      duracionMinutos: 60,
      tipo: 'Mantenimiento',
      descripcion: 'Cambio de aceite',
      estado: 'Cancelada',
      prioridad: 'Media',
      recordatorioEnviado: false,
      fechaCreacion: new Date()
    };

    const createdFirst = await firstValueFrom(service.createAppointment(firstAppt));
    expect(createdFirst.id).toBeDefined();

    // Same time, same date, but the first is Cancelada
    const secondAppt: Appointment = {
      clienteId: 2,
      clienteNombre: 'Maria Lopez',
      vehiculoId: 3,
      vehiculoInfo: 'Ford Focus 2018',
      fecha: futureDate1,
      horaInicio: '10:00',
      horaFin: '11:00',
      duracionMinutos: 60,
      tipo: 'Reparación',
      descripcion: 'Frenos',
      estado: 'Programada',
      prioridad: 'Alta',
      recordatorioEnviado: false,
      fechaCreacion: new Date()
    };

    const createdSecond = await firstValueFrom(service.createAppointment(secondAppt));
    expect(createdSecond.id).toBeDefined();

    // Same time on different date
    const thirdAppt: Appointment = {
      ...secondAppt,
      fecha: futureDate2
    };

    const createdThird = await firstValueFrom(service.createAppointment(thirdAppt));
    expect(createdThird.id).toBeDefined();
  });

  it('should update appointment and support optimistic locking', async () => {
    const futureDate = getFutureDate(5);
    const appt: Appointment = {
      clienteId: 1,
      clienteNombre: 'Carlos Gomez',
      vehiculoId: 2,
      vehiculoInfo: 'Seat Leon 2020',
      fecha: futureDate,
      horaInicio: '10:00',
      horaFin: '11:00',
      duracionMinutos: 60,
      tipo: 'Mantenimiento',
      descripcion: 'Cambio de aceite',
      estado: 'Programada',
      prioridad: 'Media',
      recordatorioEnviado: false,
      fechaCreacion: new Date(),
      version: 1
    };

    const created = await firstValueFrom(service.createAppointment(appt));
    expect(created.id).toBeDefined();

    // Successful update
    const updated = await firstValueFrom(
      service.updateAppointment(created.id!, { ...created, descripcion: 'Cambio de aceite y filtro' }, 1)
    );
    expect(updated.descripcion).toBe('Cambio de aceite y filtro');

    // Mismatched version should throw error
    await expect(
      firstValueFrom(
        service.updateAppointment(created.id!, { ...updated, descripcion: 'Another update' }, 1)
      )
    ).rejects.toThrow('La cita ha sido modificada por otro usuario');
  });

  it('should retrieve appointment by ID or throw if not found', async () => {
    const futureDate = getFutureDate(5);
    const appt: Appointment = {
      clienteId: 1,
      clienteNombre: 'Carlos Gomez',
      vehiculoId: 2,
      vehiculoInfo: 'Seat Leon 2020',
      fecha: futureDate,
      horaInicio: '10:00',
      horaFin: '11:00',
      duracionMinutos: 60,
      tipo: 'Mantenimiento',
      descripcion: 'Test',
      estado: 'Programada',
      prioridad: 'Media',
      recordatorioEnviado: false,
      fechaCreacion: new Date()
    };

    const created = await firstValueFrom(service.createAppointment(appt));
    const found = await firstValueFrom(service.getAppointmentById(created.id!));
    expect(found.id).toBe(created.id);

    expect(() => service.getAppointmentById(9999)).toThrow('Appointment not found');
  });
});
