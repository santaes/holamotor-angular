import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router } from '@angular/router';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-appointment-detail',
  templateUrl: './appointment-detail.component.html',
  styleUrls: ['./appointment-detail.component.css']
})
export class AppointmentDetailComponent implements OnInit {
  appointment: Appointment | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(+id);
    }
  }

  loadAppointment(id: number): void {
    this.isLoading = true;
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.snackBar.open(t('Error al cargar cita'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  editAppointment(): void {
    if (this.appointment?.id) {
      this.router.navigate(['/citas', this.appointment.id, 'edit']);
    }
  }

  confirmAppointment(): void {
    if (this.appointment?.id) {
      const appointmentId = this.appointment.id;
      this.appointmentService.confirmAppointment(appointmentId).subscribe({
        next: () => {
          this.snackBar.open(t('Cita confirmada'), t('Cerrar'), { duration: 3000 });
          this.loadAppointment(appointmentId);
        },
        error: (error) => {
          console.error('Error confirming appointment:', error);
          this.snackBar.open(t('Error al confirmar cita'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }

  cancelAppointment(): void {
    if (this.appointment?.id && confirm(t('¿Está seguro de cancelar esta cita?'))) {
      const appointmentId = this.appointment.id;
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: () => {
          this.snackBar.open(t('Cita cancelada'), t('Cerrar'), { duration: 3000 });
          this.loadAppointment(appointmentId);
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          this.snackBar.open(t('Error al cancelar cita'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }

  sendReminder(): void {
    if (this.appointment?.id) {
      const appointmentId = this.appointment.id;
      this.appointmentService.sendReminder(appointmentId).subscribe({
        next: () => {
          this.snackBar.open(t('Recordatorio enviado'), t('Cerrar'), { duration: 3000 });
          this.loadAppointment(appointmentId);
        },
        error: (error) => {
          console.error('Error sending reminder:', error);
          this.snackBar.open(t('Error al enviar recordatorio'), t('Cerrar'), { duration: 3000 });
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
