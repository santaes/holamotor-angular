import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { t } from '../../../../core/i18n/i18n';
import { Router } from '@angular/router';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { GoogleCalendarService, CalendarEvent } from '../../../../core/services/google-calendar.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatButtonModule,
    TranslatePipe],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  displayedColumns: string[] = ['fecha', 'hora', 'clienteNombre', 'vehiculoInfo', 'tipo', 'estado', 'acciones'];
  isLoading = true;
  selectedDate = new Date();

  constructor(
    private appointmentService: AppointmentService,
    private googleCalendarService: GoogleCalendarService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    const dayStart = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    this.appointmentService.getAppointmentsByDate(this.selectedDate).subscribe({
      next: (local) => {
        this.googleCalendarService.getEventsForRange(dayStart.toISOString(), dayEnd.toISOString()).pipe(
          catchError(() => of([] as CalendarEvent[]))
        ).subscribe((events) => {
          const googleRows = events
            .filter(e => this.isOnSelectedDay(e))
            .map(e => this.mapGoogleEvent(e));
          this.appointments = [...local, ...googleRows]
            .sort((a, b) => this.toMinutes(a.horaInicio) - this.toMinutes(b.horaInicio));
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open(t('Error al cargar citas'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private isOnSelectedDay(event: CalendarEvent): boolean {
    const day = this.selectedDate;
    const raw = event.start?.dateTime || event.start?.date;
    if (!raw) return false;
    const d = new Date(event.start!.dateTime ? raw : raw + 'T00:00:00');
    return d.getFullYear() === day.getFullYear()
      && d.getMonth() === day.getMonth()
      && d.getDate() === day.getDate();
  }

  private mapGoogleEvent(event: CalendarEvent): Appointment {
    const allDay = !!event.start?.date && !event.start?.dateTime;
    const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
    const fmt = (d: Date | null) => d
      ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      : '';
    return {
      clienteId: 0,
      clienteNombre: event.summary || '(Google Calendar)',
      vehiculoId: 0,
      vehiculoInfo: event.description || '',
      fecha: this.selectedDate,
      horaInicio: allDay ? 'Todo el día' : fmt(start),
      horaFin: allDay ? '' : fmt(end),
      duracionMinutos: start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0,
      tipo: 'Otro',
      descripcion: event.description || '',
      estado: 'Confirmada',
      prioridad: 'Media',
      recordatorioEnviado: false,
      fechaCreacion: new Date(),
      origen: 'google',
      googleEventId: event.id,
      htmlLink: event.htmlLink
    };
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = String(hhmm || '').split(':').map(Number);
    return isNaN(h) ? -1 : h * 60 + (m || 0);
  }

  onDateChange(date: Date): void {
    this.selectedDate = date;
    this.loadAppointments();
  }

  createAppointment(): void {
    this.router.navigate(['/citas/new']);
  }

  viewAppointment(id: number): void {
    this.router.navigate(['/citas', id]);
  }

  editAppointment(id: number): void {
    this.router.navigate(['/citas', id, 'edit']);
  }

  confirmAppointment(id: number): void {
    this.appointmentService.confirmAppointment(id).subscribe({
      next: () => {
        this.snackBar.open(t('Cita confirmada'), t('Cerrar'), { duration: 3000 });
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
        this.snackBar.open(t('Error al confirmar cita'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  cancelAppointment(id: number): void {
    if (confirm(t('¿Está seguro de cancelar esta cita?'))) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => {
          this.snackBar.open(t('Cita cancelada'), t('Cerrar'), { duration: 3000 });
          this.loadAppointments();
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          this.snackBar.open(t('Error al cancelar cita'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Programada': return '#2196f3';
      case 'Confirmada': return '#4caf50';
      case 'En Progreso': return '#ff9800';
      case 'Completada': return '#009688';
      case 'Cancelada': return '#f44336';
      case 'No Asistió': return '#9e9e9e';
      default: return '#999';
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'Baja': return '#4caf50';
      case 'Media': return '#ff9800';
      case 'Alta': return '#f44336';
      default: return '#999';
    }
  }
}
