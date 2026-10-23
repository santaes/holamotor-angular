import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { Router } from '@angular/router';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-appointment-list',
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
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getAppointmentsByDate(this.selectedDate).subscribe({
      next: (data) => {
        this.appointments = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open(t('Error al cargar citas'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
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
