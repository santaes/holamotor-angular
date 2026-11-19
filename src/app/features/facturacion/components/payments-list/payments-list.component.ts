import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { t } from '../../../../core/i18n/i18n';
import { Invoice } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MoneyPipe,
    TranslatePipe
  ],
  templateUrl: './payments-list.component.html',
  styleUrls: ['./payments-list.component.css']
})
export class PaymentsListComponent implements OnInit {
  payments: Invoice[] = [];
  filteredPayments: Invoice[] = [];
  displayedColumns: string[] = ['numeroFactura', 'clienteNombre', 'fechaEmision', 'total', 'estado', 'metodoPago', 'acciones'];
  isLoading = true;
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';

  constructor(
    private billingService: BillingService,
    public router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.billingService.getInvoices().subscribe({
      next: (invoices) => {
        // Filter for paid and sent invoices
        this.payments = invoices.filter(invoice => 
          invoice.estado === 'Pagada' || 
          invoice.estado === 'Enviada' ||
          (invoice.pagos && invoice.pagos.length > 0)
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.snackBar.open(t('Error al cargar pagos'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.payments];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.numeroFactura.toLowerCase().includes(search) ||
        invoice.clienteNombre.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(invoice => invoice.estado === this.statusFilter);
    }

    // Date filters
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(invoice => new Date(invoice.fechaEmision) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(invoice => new Date(invoice.fechaEmision) <= toDate);
    }

    this.filteredPayments = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onDateFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  viewInvoice(id: number): void {
    this.router.navigate(['/facturacion', id]);
  }

  printInvoice(id: number): void {
    this.router.navigate(['/facturacion', id], { queryParams: { print: true } });
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

  getPaymentMethod(payment: Invoice): string {
    if (payment.pagos && payment.pagos.length > 0) {
      return payment.pagos[payment.pagos.length - 1].metodo || 'N/A';
    }
    return payment.metodoPago || 'N/A';
  }

  getTotalPaid(invoice: Invoice): number {
    if (invoice.pagos && invoice.pagos.length > 0) {
      return invoice.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
    }
    return invoice.estado === 'Pagada' ? invoice.total : 0;
  }

  isFullyPaid(invoice: Invoice): boolean {
    return this.getTotalPaid(invoice) >= invoice.total;
  }

  getTotalRevenue(): number {
    return this.filteredPayments.reduce((sum, invoice) => sum + this.getTotalPaid(invoice), 0);
  }

  getPaidCount(): number {
    return this.filteredPayments.filter(invoice => invoice.estado === 'Pagada').length;
  }

  getPendingCount(): number {
    return this.filteredPayments.filter(invoice => invoice.estado === 'Enviada').length;
  }
}
