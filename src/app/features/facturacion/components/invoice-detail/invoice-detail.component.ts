import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoice } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css']
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  isLoading = true;
  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private billingService: BillingService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(+id);
    }
    // Check if print query parameter is present
    if (this.route.snapshot.queryParams['print']) {
      setTimeout(() => this.printInvoice(), 500);
    }
  }

  loadInvoice(id: number): void {
    this.isLoading = true;
    this.billingService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.snackBar.open(t('Error al cargar factura'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  editInvoice(): void {
    if (this.invoice?.id) {
      this.router.navigate(['/facturacion', this.invoice.id, 'edit']);
    }
  }

  printInvoice(): void {
    window.print();
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
