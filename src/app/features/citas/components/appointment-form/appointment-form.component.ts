import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../../core/services/storage.service';

@Component({
  selector: 'app-appointment-form',
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit {
  appointmentForm: FormGroup;
  isEditMode = false;
  appointmentId: number | null = null;
  pageTitle = 'Nueva Cita';

  constructor(
    private fb: FormBuilder,
    private storage: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {
    this.appointmentForm = this.createForm();
    this.setupCustomerPicker();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.appointmentId = +id;
      this.isEditMode = true;
      this.pageTitle = 'Editar Cita';
      this.loadAppointment(this.appointmentId);
    }
  }

  customers: any[] = [];
  vehicles: any[] = [];

  private setupCustomerPicker(): void {
    this.customers = this.storage.getItem<any[]>('customers') || [];
    this.appointmentForm.get('clienteId')?.valueChanges.subscribe(id => {
      const customer = this.customers.find(c => c.id === +id);
      this.vehicles = customer?.vehiculos || [];
      if (customer) {
        this.appointmentForm.patchValue({ clienteNombre: `${customer.nombre} ${customer.apellido}` }, { emitEvent: false });
      }
    });
    this.appointmentForm.get('vehiculoId')?.valueChanges.subscribe(id => {
      const vehicle = this.vehicles.find(v => v.id === +id);
      if (vehicle) {
        this.appointmentForm.patchValue({ vehiculoInfo: `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} · ${vehicle.placa}` }, { emitEvent: false });
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      clienteId: ['', [Validators.required]],
      clienteNombre: ['', [Validators.required]],
      vehiculoId: ['', [Validators.required]],
      vehiculoInfo: ['', [Validators.required]],
      fecha: [new Date(), [Validators.required]],
      horaInicio: ['', [Validators.required]],
      horaFin: ['', [Validators.required]],
      duracionMinutos: [60, [Validators.required, Validators.min(15)]],
      tipo: ['Mantenimiento', [Validators.required]],
      descripcion: ['', [Validators.required]],
      mecanicoId: [''],
      mecanicoNombre: [''],
      estado: ['Programada', [Validators.required]],
      prioridad: ['Media', [Validators.required]],
      recordatorioEnviado: [false],
      notas: [''],
      ordenReparacionId: ['']
    });
  }

  loadAppointment(id: number): void {
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        this.appointmentForm.patchValue(appointment);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.snackBar.open('Error al cargar cita', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      const appointment: Appointment = {
        ...this.appointmentForm.value,
        fecha: new Date(this.appointmentForm.value.fecha),
        fechaCreacion: this.isEditMode ? new Date() : new Date()
      };

      if (this.isEditMode && this.appointmentId) {
        this.appointmentService.updateAppointment(this.appointmentId, appointment).subscribe({
          next: () => {
            this.snackBar.open('Cita actualizada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/citas']);
          },
          error: (error) => {
            console.error('Error updating appointment:', error);
            this.snackBar.open('Error al actualizar cita', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        this.appointmentService.createAppointment(appointment).subscribe({
          next: () => {
            this.snackBar.open('Cita creada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/citas']);
          },
          error: (error) => {
            console.error('Error creating appointment:', error);
            this.snackBar.open('Error al crear cita', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/citas']);
  }

  getErrorMessage(field: string): string {
    const control = this.appointmentForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('min')) {
      return 'Valor mínimo es 15 minutos';
    }
    return '';
  }
}
