import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../../core/services/storage.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { QuickCustomerDialogComponent } from '../../../../core/components/quick-customer-dialog/quick-customer-dialog.component';

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
    private dialog: MatDialog,
    private settingsService: SettingsService,
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
    this.storage.changes$.pipe(takeUntilDestroyed()).subscribe(key => {
      if (key === 'customers') {
        this.customers = this.storage.getItem<any[]>('customers') || [];
        const selected = this.customers.find(c => c.id === +this.appointmentForm.get('clienteId')?.value);
        this.vehicles = selected?.vehiculos || [];
      }
    });
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

  addCustomer(): void {
    this.dialog
      .open(QuickCustomerDialogComponent, { width: '560px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(customer => {
        if (!customer) {
          return;
        }
        this.customers = this.storage.getItem<any[]>('customers') || [];
        this.appointmentForm.patchValue({ clienteId: customer.id });
        if (customer.vehiculos?.length) {
          this.appointmentForm.patchValue({ vehiculoId: customer.vehiculos[0].id });
        }
        this.snackBar.open(t('Cliente creado y seleccionado'), t('Cerrar'), { duration: 3000 });
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
      duracionMinutos: [this.settingsService.value.appointmentDuration, [Validators.required, Validators.min(15)]],
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
        this.snackBar.open(t('Error al cargar cita'), t('Cerrar'), { duration: 3000 });
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
            this.snackBar.open(t('Cita actualizada exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/citas']);
          },
          error: (error) => {
            console.error('Error updating appointment:', error);
            this.snackBar.open(t('Error al actualizar cita'), t('Cerrar'), { duration: 3000 });
          }
        });
      } else {
        this.appointmentService.createAppointment(appointment).subscribe({
          next: () => {
            this.snackBar.open(t('Cita creada exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/citas']);
          },
          error: (error) => {
            console.error('Error creating appointment:', error);
            this.snackBar.open(t('Error al crear cita'), t('Cerrar'), { duration: 3000 });
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
      return t('Este campo es requerido');
    }
    if (control?.hasError('min')) {
      return t('Valor mínimo es 15 minutos');
    }
    return '';
  }
}
