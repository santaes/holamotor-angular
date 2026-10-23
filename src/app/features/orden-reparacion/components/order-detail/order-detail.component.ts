import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  order: RepairOrder | null = null;
  isLoading = true;
  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(+id);
    }
  }

  loadOrder(id: number): void {
    this.isLoading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.snackBar.open(t('Error al cargar orden'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  editOrder(): void {
    if (this.order?.id) {
      this.router.navigate(['/ordenes', this.order.id, 'edit']);
    }
  }

  approveOrder(): void {
    if (this.order?.id) {
      this.orderService.approveOrder(this.order.id).subscribe({
        next: () => {
          this.snackBar.open(t('Orden aprobada'), t('Cerrar'), { duration: 3000 });
          this.loadOrder(this.order.id!);
        },
        error: (error) => {
          console.error('Error approving order:', error);
          this.snackBar.open(t('Error al aprobar orden'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
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
