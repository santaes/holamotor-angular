import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RepairOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../../core/services/storage.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { QuickCustomerDialogComponent } from '../../../../core/components/quick-customer-dialog/quick-customer-dialog.component';

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css']
})
export class OrderFormComponent implements OnInit {
  orderForm: FormGroup;
  isEditMode = false;
  orderId: number | null = null;
  pageTitle = 'Nueva Orden de Reparación';

  constructor(
    private fb: FormBuilder,
    private storage: StorageService,
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {
    this.orderForm = this.createForm();
    this.setupCustomerPicker();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId = +id;
      this.isEditMode = true;
      this.pageTitle = 'Editar Orden de Reparación';
      this.loadOrder(this.orderId);
    }
  }

  customers: any[] = [];
  vehicles: any[] = [];

  private setupCustomerPicker(): void {
    this.customers = this.storage.getItem<any[]>('customers') || [];
    this.storage.changes$.pipe(takeUntilDestroyed()).subscribe(key => {
      if (key === 'customers') {
        this.customers = this.storage.getItem<any[]>('customers') || [];
        const selected = this.customers.find(c => c.id === +this.orderForm.get('clienteId')?.value);
        this.vehicles = selected?.vehiculos || [];
      }
    });
    this.orderForm.get('clienteId')?.valueChanges.subscribe(id => {
      const customer = this.customers.find(c => c.id === +id);
      this.vehicles = customer?.vehiculos || [];
      if (customer) {
        this.orderForm.patchValue({ clienteNombre: `${customer.nombre} ${customer.apellido}` }, { emitEvent: false });
      }
    });
    this.orderForm.get('vehiculoId')?.valueChanges.subscribe(id => {
      const vehicle = this.vehicles.find(v => v.id === +id);
      if (vehicle) {
        this.orderForm.patchValue({ vehiculoInfo: `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} · ${vehicle.placa}` }, { emitEvent: false });
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
        this.orderForm.patchValue({ clienteId: customer.id });
        if (customer.vehiculos?.length) {
          this.orderForm.patchValue({ vehiculoId: customer.vehiculos[0].id });
        }
        this.snackBar.open(t('Cliente creado y seleccionado'), t('Cerrar'), { duration: 3000 });
      });
  }

  createForm(): FormGroup {
    return this.fb.group({
      numeroOrden: ['', [Validators.required]],
      clienteId: ['', [Validators.required]],
      clienteNombre: ['', [Validators.required]],
      vehiculoId: ['', [Validators.required]],
      vehiculoInfo: ['', [Validators.required]],
      fechaIngreso: [new Date(), [Validators.required]],
      fechaEstimadaSalida: [''],
      fechaSalida: [''],
      estado: ['Pendiente', [Validators.required]],
      prioridad: ['Media', [Validators.required]],
      mecanicoAsignado: [''],
      mecanicoNombre: [''],
      descripcionProblema: ['', [Validators.required]],
      diagnostico: [''],
      trabajoRealizado: [''],
      costoEstimado: [0, [Validators.required, Validators.min(0)]],
      costoFinal: [0, [Validators.min(0)]],
      aprobadoPorCliente: [false],
      observaciones: ['']
    });
  }

  loadOrder(id: number): void {
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.orderForm.patchValue(order);
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.snackBar.open(t('Error al cargar orden'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      const order: RepairOrder = {
        ...this.orderForm.value,
        fechaIngreso: new Date(this.orderForm.value.fechaIngreso),
        fechaEstimadaSalida: this.orderForm.value.fechaEstimadaSalida ? new Date(this.orderForm.value.fechaEstimadaSalida) : undefined,
        fechaSalida: this.orderForm.value.fechaSalida ? new Date(this.orderForm.value.fechaSalida) : undefined
      };

      if (this.isEditMode && this.orderId) {
        this.orderService.updateOrder(this.orderId, order).subscribe({
          next: () => {
            this.snackBar.open(t('Orden actualizada exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/ordenes']);
          },
          error: (error) => {
            console.error('Error updating order:', error);
            this.snackBar.open(t('Error al actualizar orden'), t('Cerrar'), { duration: 3000 });
          }
        });
      } else {
        this.orderService.createOrder(order).subscribe({
          next: () => {
            this.snackBar.open(t('Orden creada exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/ordenes']);
          },
          error: (error) => {
            console.error('Error creating order:', error);
            this.snackBar.open(t('Error al crear orden'), t('Cerrar'), { duration: 3000 });
          }
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/ordenes']);
  }

  getErrorMessage(field: string): string {
    const control = this.orderForm.get(field);
    if (control?.hasError('required')) {
      return t('Este campo es requerido');
    }
    if (control?.hasError('min')) {
      return t('Valor mínimo es 0');
    }
    return '';
  }
}
