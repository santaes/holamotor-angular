import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
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
import { Observable, of, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { QuickCustomerDialogComponent } from '../../../../core/components/quick-customer-dialog/quick-customer-dialog.component';
import { GoogleCalendarService, CalendarEvent } from '../../../../core/services/google-calendar.service';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    TranslatePipe,
    ReactiveFormsModule,
    FormsModule],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit {
  appointmentForm: FormGroup;
  isEditMode = false;
  appointmentId: number | null = null;
  pageTitle = 'Nueva Cita';
  
  // Autocomplete observables
  filteredCustomers$: Observable<any[]>;
  filteredVehicles$: Observable<any[]>;
  
  // Recurring appointment options
  isRecurring = false;
  recurringPattern = 'Semanal';
  recurringInterval = 1;
  recurringEndDate: Date | null = null;
  
  // Google Calendar sync
  syncToGoogleCalendar = false;
  
  // Reminder settings
  reminderEnabled = false;
  reminderMinutes = [24 * 60, 60, 30]; // Default: 1 day, 1 hour, 30 minutes before
  
  constructor(
    private fb: FormBuilder,
    private storage: StorageService,
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private googleCalendarService: GoogleCalendarService
  ) {
    this.appointmentForm = this.createForm();
    this.setupCustomerPicker();
    this.setupAutocomplete();
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
  private vehicles$ = new BehaviorSubject<any[]>([]);

  private setVehicles(list: any[]): void {
    this.vehicles = list;
    this.vehicles$.next(list);
  }

  private setupCustomerPicker(): void {
    this.customers = this.storage.getItem<any[]>('customers') || [];
    this.storage.changes$.pipe(takeUntilDestroyed()).subscribe(key => {
      if (key === 'customers') {
        this.customers = this.storage.getItem<any[]>('customers') || [];
        const selected = this.customers.find(c => c.id === +this.appointmentForm.get('clienteId')?.value);
        this.setVehicles(selected?.vehiculos || []);
      }
    });
    this.appointmentForm.get('clienteId')?.valueChanges.subscribe(id => {
      const customer = this.customers.find(c => c.id === +id);
      this.setVehicles(customer?.vehiculos || []);
      this.appointmentForm.patchValue({ vehiculoId: '', vehiculoInfo: '' }, { emitEvent: false });
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
  
  private setupAutocomplete(): void {
    // Customer autocomplete
    this.filteredCustomers$ = this.appointmentForm.get('clienteNombre')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCustomers(value))
    ) || of([]);
    
    // Vehicle autocomplete
    this.filteredVehicles$ = combineLatest([
      this.vehicles$,
      this.appointmentForm.get('vehiculoInfo')?.valueChanges.pipe(startWith('')) || of('')
    ]).pipe(
      map(([vehicles, value]) => this.filterVehicles(vehicles, value))
    );
  }
  
  private filterCustomers(value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.customers.filter(c => 
      `${c.nombre} ${c.apellido} ${c.telefono}`.toLowerCase().includes(filterValue)
    );
  }
  
  private filterVehicles(vehicles: any[], value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return vehicles.filter(v =>
      `${v.marca} ${v.modelo} ${v.anio} ${v.placa}`.toLowerCase().includes(filterValue)
    );
  }
  
  onCustomerSelected(event: any): void {
    const customer = event.option.value;
    this.appointmentForm.patchValue({ 
      clienteId: customer.id,
      clienteNombre: `${customer.nombre} ${customer.apellido}`
    });
    this.setVehicles(customer.vehiculos || []);
  }

  displayCustomer(customer: any): string {
    if (!customer) return '';
    if (typeof customer === 'string') return customer;
    return `${customer.nombre} ${customer.apellido}`;
  }
  
  onVehicleSelected(event: any): void {
    const vehicle = event.option.value;
    this.appointmentForm.patchValue({ 
      vehiculoId: vehicle.id,
      vehiculoInfo: `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} · ${vehicle.placa}`
    });
  }
  
  displayVehicle(vehicle: any): string {
    if (!vehicle) return '';
    if (typeof vehicle === 'string') return vehicle;
    return `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} · ${vehicle.placa}`;
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
      ordenReparacionId: [''],
      isRecurring: [false],
      syncToGoogleCalendar: [false],
      reminderEnabled: [false],
      reminderMinutes: [[]]
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
  
  checkTimeConflict(): void {
    const fecha = this.appointmentForm.get('fecha')?.value;
    const horaInicio = this.appointmentForm.get('horaInicio')?.value;
    const horaFin = this.appointmentForm.get('horaFin')?.value;
    
    if (fecha && horaInicio && horaFin) {
      const appointment = {
        fecha: new Date(fecha),
        horaInicio,
        horaFin
      };
      
      // This would need to be implemented in the service
      // For now, just show a placeholder
      console.log('Checking time conflict for:', appointment);
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;
      const appointment: Appointment = {
        ...formValue,
        fecha: new Date(formValue.fecha),
        fechaCreacion: this.isEditMode ? new Date() : new Date()
      };
      
      // Handle recurring appointment
      if (formValue.isRecurring) {
        this.createRecurringAppointments(appointment);
        return;
      }

      if (this.isEditMode && this.appointmentId) {
        this.appointmentService.updateAppointment(this.appointmentId, appointment).subscribe({
          next: () => {
            if (formValue.syncToGoogleCalendar) {
              this.googleCalendarService.checkConnection().subscribe(connected => {
                if (connected) {
                  this.syncToGoogleCalendarEvent(appointment);
                } else {
                  this.snackBar.open(t('Conecta Google Calendar en Configuración para sincronizar'), t('Cerrar'), { duration: 4000 });
                }
              });
            }
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
            if (formValue.syncToGoogleCalendar) {
              this.googleCalendarService.checkConnection().subscribe(connected => {
                if (connected) {
                  this.syncToGoogleCalendarEvent(appointment);
                } else {
                  this.snackBar.open(t('Conecta Google Calendar en Configuración para sincronizar'), t('Cerrar'), { duration: 4000 });
                }
              });
            }
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
  
  private createRecurringAppointments(appointment: Appointment): void {
    // This would create multiple appointments based on the recurring pattern
    // For now, just create the first one
    this.appointmentService.createAppointment(appointment).subscribe({
      next: () => {
        if (this.appointmentForm.value.syncToGoogleCalendar) {
          this.googleCalendarService.checkConnection().subscribe(connected => {
            if (connected) {
              this.syncToGoogleCalendarEvent(appointment);
            } else {
              this.snackBar.open(t('Conecta Google Calendar en Configuración para sincronizar'), t('Cerrar'), { duration: 4000 });
            }
          });
        }
        this.snackBar.open(t('Cita recurrente creada exitosamente'), t('Cerrar'), { duration: 3000 });
        this.router.navigate(['/citas']);
      },
      error: (error) => {
        console.error('Error creating recurring appointment:', error);
        this.snackBar.open(t('Error al crear cita recurrente'), t('Cerrar'), { duration: 3000 });
      }
    });
  }
  
  private syncToGoogleCalendarEvent(appointment: Appointment): void {
    const d = appointment.fecha instanceof Date ? appointment.fecha : new Date(appointment.fecha);
    const dateStr = d.toISOString().split('T')[0];
    const event: Partial<CalendarEvent> = {
      summary: `${appointment.tipo} - ${appointment.clienteNombre}`,
      description: appointment.descripcion,
      start: { 
        dateTime: `${dateStr}T${appointment.horaInicio}:00`,
        timeZone: 'Europe/Madrid'
      },
      end: { 
        dateTime: `${dateStr}T${appointment.horaFin}:00`,
        timeZone: 'Europe/Madrid'
      }
    };
    
    this.googleCalendarService.createEvent(event).subscribe({
      next: () => {
        this.snackBar.open(t('Cita sincronizada con Google Calendar'), t('Cerrar'), { duration: 3000 });
      },
      error: (error) => {
        console.error('Error syncing to Google Calendar:', error);
        this.snackBar.open(t('Error al sincronizar con Google Calendar'), t('Cerrar'), { duration: 3000 });
      }
    });
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
