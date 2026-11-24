import { Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoice } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { ExcelParserService } from '../../services/excel-parser.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatButtonModule,
    TranslatePipe,
    MoneyPipe],
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
    private excelParserService: ExcelParserService,
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

  async exportToExcel(): Promise<void> {
    if (!this.invoice) return;

    try {
      const workbook = this.excelParserService.exportInvoiceToExcel(this.invoice);
      const filename = `Factura_${this.invoice.numeroFactura}.xlsx`;
      await this.excelParserService.downloadExcel(workbook, filename);
      this.snackBar.open(t('Factura exportada exitosamente'), t('Cerrar'), { duration: 3000 });
    } catch (error) {
      console.error('Error exporting invoice:', error);
      this.snackBar.open(t('Error al exportar factura'), t('Cerrar'), { duration: 3000 });
    }
  }

  get totalPagado(): number {
    return (this.invoice?.pagos || []).reduce((sum, p) => sum + (p.monto || 0), 0);
  }

  get pendiente(): number {
    return Math.max(0, (this.invoice?.total || 0) - this.totalPagado);
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

  addPayment(): void {
    if (!this.invoice) return;
    
    const paymentMethod = prompt(t('Método de pago (Efectivo, Tarjeta, Transferencia, Cheque):'), 'Efectivo');
    if (!paymentMethod) return;
    
    const validMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque'];
    if (!validMethods.includes(paymentMethod)) {
      this.snackBar.open(t('Método de pago no válido'), t('Cerrar'), { duration: 3000 });
      return;
    }
    
    const amount = prompt(t('Monto del pago:'), this.invoice.total.toString());
    if (!amount) return;
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      this.snackBar.open(t('Monto no válido'), t('Cerrar'), { duration: 3000 });
      return;
    }
    
    const payment = {
      id: (this.invoice.pagos?.length || 0) + 1,
      monto: paymentAmount,
      metodo: paymentMethod as 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque',
      fecha: new Date(),
      referencia: `Pago manual factura ${this.invoice.numeroFactura}`,
      notas: 'Pago registrado manualmente'
    };
    
    const updatedInvoice = {
      ...this.invoice,
      pagos: [...(this.invoice.pagos || []), payment]
    };
    
    // Check if fully paid
    const totalPaid = updatedInvoice.pagos.reduce((sum, p) => sum + p.monto, 0);
    if (totalPaid >= updatedInvoice.total) {
      updatedInvoice.estado = 'Pagada';
      updatedInvoice.fechaPago = new Date();
    }
    
    this.billingService.updateInvoice(this.invoice.id!, updatedInvoice).subscribe({
      next: () => {
        this.snackBar.open(t('Pago registrado exitosamente'), t('Cerrar'), { duration: 3000 });
        this.loadInvoice(this.invoice!.id!);
      },
      error: (error) => {
        console.error('Error adding payment:', error);
        this.snackBar.open(t('Error al registrar pago'), t('Cerrar'), { duration: 3000 });
      }
    });
  }
}
