import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { t } from '../../../../core/i18n/i18n';
import { Router } from '@angular/router';
import { RepairOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  orders: RepairOrder[] = [];
  displayedColumns: string[] = ['numeroOrden', 'clienteNombre', 'vehiculoInfo', 'fechaIngreso', 'estado', 'prioridad', 'acciones'];
  isLoading = true;
  filterStatus = '';

  constructor(
    private orderService: OrderService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.snackBar.open(t('Error al cargar órdenes'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  filterByStatus(status: string): void {
    this.filterStatus = status;
    if (status) {
      this.orderService.getOrdersByStatus(status).subscribe({
        next: (data) => {
          this.orders = data;
        },
        error: (error) => {
          console.error('Error filtering orders:', error);
        }
      });
    } else {
      this.loadOrders();
    }
  }

  viewOrder(id: number): void {
    this.router.navigate(['/ordenes', id]);
  }

  editOrder(id: number): void {
    this.router.navigate(['/ordenes', id, 'edit']);
  }

  createOrder(): void {
    this.router.navigate(['/ordenes/new']);
  }

  updateStatus(id: number, newStatus: string): void {
    this.orderService.updateOrderStatus(id, newStatus as RepairOrder['estado']).subscribe({
      next: () => {
        this.snackBar.open(t('Estado actualizado'), t('Cerrar'), { duration: 3000 });
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.snackBar.open(t('Error al actualizar estado'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Pendiente': return '#ff9800';
      case 'En Progreso': return '#2196f3';
      case 'Esperando Partes': return '#9c27b0';
      case 'Listo': return '#4caf50';
      case 'Entregado': return '#009688';
      case 'Cancelado': return '#f44336';
      default: return '#999';
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'Baja': return '#4caf50';
      case 'Media': return '#ff9800';
      case 'Alta': return '#f44336';
      case 'Urgente': return '#d32f2f';
      default: return '#999';
    }
  }
}
