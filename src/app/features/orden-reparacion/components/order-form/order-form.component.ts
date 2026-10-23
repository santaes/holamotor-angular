import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RepairOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {
    this.orderForm = this.createForm();
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
        this.snackBar.open('Error al cargar orden', 'Cerrar', { duration: 3000 });
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
            this.snackBar.open('Orden actualizada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/ordenes']);
          },
          error: (error) => {
            console.error('Error updating order:', error);
            this.snackBar.open('Error al actualizar orden', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        this.orderService.createOrder(order).subscribe({
          next: () => {
            this.snackBar.open('Orden creada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/ordenes']);
          },
          error: (error) => {
            console.error('Error creating order:', error);
            this.snackBar.open('Error al crear orden', 'Cerrar', { duration: 3000 });
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
      return 'Este campo es requerido';
    }
    if (control?.hasError('min')) {
      return 'Valor mínimo es 0';
    }
    return '';
  }
}
