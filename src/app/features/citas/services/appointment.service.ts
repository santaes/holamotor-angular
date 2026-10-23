import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Appointment, RecurringAppointment } from '../models/appointment.model';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointments$ = new BehaviorSubject<Appointment[]>([]);
  private recurringAppointments$ = new BehaviorSubject<RecurringAppointment[]>([]);

  constructor(private storageService: StorageService) {
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
    const appointments = this.appointments$.value;
    const newAppointment = { ...appointment, id: this.generateId(appointments) };
    appointments.push(newAppointment);
    this.saveAppointments(appointments);
    return of(newAppointment);
  }

  updateAppointment(id: number, appointment: Appointment): Observable<Appointment> {
    const appointments = this.appointments$.value;
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index] = { ...appointment, id };
      this.saveAppointments(appointments);
      return of(appointments[index]);
    }
    throw new Error('Appointment not found');
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
      appointments[index].estado = 'Confirmada';
      this.saveAppointments(appointments);
      return of(appointments[index]);
    }
    throw new Error('Appointment not found');
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
