import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { Appointment, RecurringAppointment } from '../models/appointment.model';
import { StorageService } from '../../../core/services/storage.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointments$ = new BehaviorSubject<Appointment[]>([]);
  private recurringAppointments$ = new BehaviorSubject<RecurringAppointment[]>([]);

  constructor(
    private storageService: StorageService,
    private transactionService: TransactionService
  ) {
    this.loadData();
    this.storageService.changes$.subscribe(key => {
      if (['appointments', 'recurringAppointments'].includes(key)) {
        this.loadData();
      }
    });
  }

  private loadData(): void {
    const appointments = this.storageService.getItem<Appointment[]>('appointments') || [];
    this.appointments$.next(appointments);
    const recurring = this.storageService.getItem<RecurringAppointment[]>('recurringAppointments') || [];
    this.recurringAppointments$.next(recurring);
  }

  private saveAppointments(appointments: Appointment[]): void {
    this.storageService.setItem('appointments', appointments);
    this.appointments$.next(appointments);
  }

  private saveRecurringAppointments(recurring: RecurringAppointment[]): void {
    this.storageService.setItem('recurringAppointments', recurring);
    this.recurringAppointments$.next(recurring);
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointments$.asObservable();
  }

  getAppointmentById(id: number): Observable<Appointment> {
    const appointments = this.appointments$.value;
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      return of(appointment);
    }
    throw new Error('Appointment not found');
  }

  createAppointment(appointment: Appointment): Observable<Appointment> {
    // Input validation
    if (!appointment.clienteId || !appointment.fecha || !appointment.horaInicio || !appointment.horaFin) {
      return throwError(() => new Error('Cliente, fecha, hora de inicio y hora de fin son requeridos'));
    }
    if (this.timeOnDate(appointment.fecha, appointment.horaInicio) >= this.timeOnDate(appointment.fecha, appointment.horaFin)) {
      return throwError(() => new Error('La hora de fin debe ser posterior a la hora de inicio'));
    }
    if (this.timeOnDate(appointment.fecha, appointment.horaInicio) < Date.now()) {
      return throwError(() => new Error('La fecha de la cita no puede ser en el pasado'));
    }
    if (this.hasTimeConflict(appointment)) {
      return throwError(() => new Error('Existe un conflicto de horario con otra cita'));
    }

    const appointments = this.appointments$.value;
    const newAppointment = { ...appointment, id: this.generateId(appointments) };
    appointments.push(newAppointment);
    this.saveAppointments(appointments);
    return of(newAppointment);
  }

  updateAppointment(id: number, appointment: Appointment, expectedVersion?: number): Observable<Appointment> {
    // Input validation
    if (!appointment.clienteId || !appointment.fecha || !appointment.horaInicio || !appointment.horaFin) {
      return throwError(() => new Error('Cliente, fecha, hora de inicio y hora de fin son requeridos'));
    }
    if (this.timeOnDate(appointment.fecha, appointment.horaInicio) >= this.timeOnDate(appointment.fecha, appointment.horaFin)) {
      return throwError(() => new Error('La hora de fin debe ser posterior a la hora de inicio'));
    }
    if (this.hasTimeConflict(appointment, id)) {
      return throwError(() => new Error('Existe un conflicto de horario con otra cita'));
    }

    const appointments = this.appointments$.value;
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      const existingAppointment = appointments[index];

      // Optimistic locking check
      if (expectedVersion !== undefined && existingAppointment.version !== expectedVersion) {
        return throwError(() => new Error('La cita ha sido modificada por otro usuario. Por favor, recarga los datos.'));
      }

      // Update with new version
      const updatedAppointment = this.transactionService.addVersion({ ...appointment, id });
      appointments[index] = updatedAppointment;
      this.saveAppointments(appointments);
      return of(updatedAppointment);
    }
    return throwError(() => new Error('Appointment not found'));
  }

  deleteAppointment(id: number): Observable<void> {
    const appointments = this.appointments$.value.filter(a => a.id !== id);
    this.saveAppointments(appointments);
    return of(void 0);
  }

  updateAppointmentStatus(id: number, estado: Appointment['estado']): Observable<Appointment> {
    const appointments = this.appointments$.value;
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].estado = estado;
      this.saveAppointments(appointments);
      return of(appointments[index]);
    }
    throw new Error('Appointment not found');
  }

  confirmAppointment(id: number): Observable<Appointment> {
    return this.updateAppointmentStatus(id, 'Confirmada');
  }

  cancelAppointment(id: number): Observable<Appointment> {
    return this.updateAppointmentStatus(id, 'Cancelada');
  }

  getAppointmentsByDate(date: Date): Observable<Appointment[]> {
    const appointments = this.appointments$.value.filter(a => {
      const appointmentDate = new Date(a.fecha);
      return appointmentDate.toDateString() === date.toDateString();
    });
    return of(appointments);
  }

  getAppointmentsByCustomer(customerId: number): Observable<Appointment[]> {
    const appointments = this.appointments$.value.filter(a => a.clienteId === customerId);
    return of(appointments);
  }

  getAppointmentsByMechanic(mechanicId: number): Observable<Appointment[]> {
    const appointments = this.appointments$.value.filter(a => a.mecanicoId === mechanicId);
    return of(appointments);
  }

  getAppointmentsByDateRange(startDate: Date, endDate: Date): Observable<Appointment[]> {
    const appointments = this.appointments$.value.filter(a => {
      const appointmentDate = new Date(a.fecha);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
    return of(appointments);
  }

  sendReminder(id: number): Observable<Appointment> {
    const appointments = this.appointments$.value;
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      const appointment = appointments[index];
      // Update status and mark reminder as sent
      appointment.estado = 'Confirmada';
      appointment.recordatorioEnviado = true;
      this.saveAppointments(appointments);

      return of(appointment);
    }
    return throwError(() => new Error('Appointment not found'));
  }

  private timeOnDate(fecha: any, hhmm: string): number {
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    day.setHours(h || 0, m || 0, 0, 0);
    return day.getTime();
  }

  private sameDay(a: any, b: any): boolean {
    const da = a instanceof Date ? a : new Date(a);
    const db = b instanceof Date ? b : new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }

  private hasTimeConflict(appointment: Appointment, excludeId?: number): boolean {
    const newStart = this.timeOnDate(appointment.fecha, appointment.horaInicio);
    const newEnd = this.timeOnDate(appointment.fecha, appointment.horaFin);

    return this.appointments$.value.some(a => {
      if (a.id === excludeId) return false;
      if (!this.sameDay(a.fecha, appointment.fecha)) return false;
      if (a.estado === 'Cancelada' || a.estado === 'No Asistió') return false;

      const existingStart = this.timeOnDate(a.fecha, a.horaInicio);
      const existingEnd = this.timeOnDate(a.fecha, a.horaFin);

      // Check for time overlap
      return (newStart < existingEnd && newEnd > existingStart);
    });
  }

  // Recurring appointments
  getRecurringAppointments(): Observable<RecurringAppointment[]> {
    return this.recurringAppointments$.asObservable();
  }

  createRecurringAppointment(recurring: RecurringAppointment): Observable<RecurringAppointment> {
    const recurringAppointments = this.recurringAppointments$.value;
    const newRecurring = { ...recurring, id: this.generateId(recurringAppointments) };
    recurringAppointments.push(newRecurring);
    this.saveRecurringAppointments(recurringAppointments);
    return of(newRecurring);
  }

  updateRecurringAppointment(id: number, recurring: RecurringAppointment): Observable<RecurringAppointment> {
    const recurringAppointments = this.recurringAppointments$.value;
    const index = recurringAppointments.findIndex(r => r.id === id);
    if (index !== -1) {
      recurringAppointments[index] = { ...recurring, id };
      this.saveRecurringAppointments(recurringAppointments);
      return of(recurringAppointments[index]);
    }
    throw new Error('Recurring appointment not found');
  }

  deleteRecurringAppointment(id: number): Observable<void> {
    const recurringAppointments = this.recurringAppointments$.value.filter(r => r.id !== id);
    this.saveRecurringAppointments(recurringAppointments);
    return of(void 0);
  }

  private generateId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }
}
