import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { Router } from '@angular/router';
import { Invoice } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  displayedColumns: string[] = ['numeroFactura', 'clienteNombre', 'fechaEmision', 'total', 'estado', 'acciones'];
  isLoading = true;
  filterStatus = '';

  constructor(
    private billingService: BillingService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.billingService.getInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.snackBar.open(t('Error al cargar facturas'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  createInvoice(): void {
    this.router.navigate(['/facturacion/new']);
  }

  viewInvoice(id: number): void {
    this.router.navigate(['/facturacion', id]);
  }

  printInvoice(id: number): void {
    this.router.navigate(['/facturacion', id], { queryParams: { print: true } });
  }

  editInvoice(id: number): void {
    this.router.navigate(['/facturacion', id, 'edit']);
  }

  deleteInvoice(id: number): void {
    if (confirm(t('¿Está seguro de eliminar esta factura?'))) {
      this.billingService.deleteInvoice(id).subscribe({
        next: () => {
          this.snackBar.open(t('Factura eliminada exitosamente'), t('Cerrar'), { duration: 3000 });
          this.loadInvoices();
        },
        error: (error) => {
          console.error('Error deleting invoice:', error);
          this.snackBar.open(t('Error al eliminar factura'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Borrador': return '#9e9e9e';
      case 'Enviada': return '#2196f3';
      case 'Pagada': return '#4caf50';
      case 'Vencida': return '#f44336';
      case 'Cancelada': return '#757575';
      default: return '#999';
    }
  }
}
