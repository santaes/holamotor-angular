import { Component, OnInit } from '@angular/core';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoice, InvoiceItem, InvoicePayment } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { ExcelParserService } from '../../services/excel-parser.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { InvoiceItemDialogComponent } from '../invoice-item-dialog/invoice-item-dialog.component';
import { InvoicePaymentDialogComponent } from '../invoice-payment-dialog/invoice-payment-dialog.component';
import { InvoiceInfoDialogComponent, InvoiceInfoResult } from '../invoice-info-dialog/invoice-info-dialog.component';
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
    MatDialogModule,
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
    private settingsService: SettingsService,
    private dialog: MatDialog,
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

  get hasBillingData(): boolean {
    const inv = this.invoice;
    return !!(inv?.clienteNif || inv?.clienteDireccion || inv?.clienteCiudad ||
      inv?.clienteCodigoPostal || inv?.clienteTelefono || inv?.clienteEmail);
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

  addItem(): void {
    if (!this.invoice || this.invoice.estado === 'Cancelada') return;

    const dialogRef = this.dialog.open(InvoiceItemDialogComponent, {
      width: '560px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((item: InvoiceItem) => {
      if (item && this.invoice) {
        const items = [...(this.invoice.items || [])];
        items.push({
          ...item,
          id: items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1,
          subtotal: item.cantidad * item.precioUnitario
        });
        this.saveItems(items);
        this.snackBar.open(t('Posición agregada'), t('Cerrar'), { duration: 2000 });
      }
    });
  }

  editItem(index: number): void {
    if (!this.invoice || this.invoice.estado === 'Cancelada') return;
    const item = this.invoice.items?.[index];
    if (!item) return;

    const dialogRef = this.dialog.open(InvoiceItemDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: item
    });

    dialogRef.afterClosed().subscribe((updated: InvoiceItem) => {
      if (updated && this.invoice) {
        const items = [...(this.invoice.items || [])];
        items[index] = { ...updated, id: item.id };
        this.saveItems(items);
        this.snackBar.open(t('Posición actualizada'), t('Cerrar'), { duration: 2000 });
      }
    });
  }

  removeItem(index: number): void {
    if (!this.invoice || this.invoice.estado === 'Cancelada') return;
    if (!confirm(t('¿Eliminar esta posición de la factura?'))) return;

    const items = (this.invoice.items || []).filter((_, i) => i !== index);
    this.saveItems(items);
    this.snackBar.open(t('Posición eliminada'), t('Cerrar'), { duration: 2000 });
  }

  private saveItems(items: InvoiceItem[]): void {
    if (!this.invoice?.id) return;

    const subtotal = Math.round(items.reduce((sum, item) => sum + (item.subtotal || item.cantidad * item.precioUnitario || 0), 0) * 100) / 100;
    const impuestos = Math.round(subtotal * this.settingsService.value.taxRate) / 100;
    const descuento = this.invoice.descuento || 0;
    const total = Math.max(0, Math.round((subtotal + impuestos - descuento) * 100) / 100);

    const updatedInvoice: Invoice = { ...this.invoice, items, subtotal, impuestos, total };
    this.syncEstadoFromPayments(updatedInvoice);

    this.billingService.updateInvoice(this.invoice.id, updatedInvoice).subscribe({
      next: () => {
        this.loadInvoice(this.invoice!.id!);
      },
      error: (error) => {
        console.error('Error updating invoice items:', error);
        this.snackBar.open(t('Error al actualizar factura'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  addPayment(): void {
    if (!this.invoice || this.invoice.estado === 'Cancelada') return;

    const dialogRef = this.dialog.open(InvoicePaymentDialogComponent, {
      width: '480px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((payment: InvoicePayment) => {
      if (payment && this.invoice) {
        const pagos = [...(this.invoice.pagos || [])];
        pagos.push({ ...payment, id: pagos.length > 0 ? Math.max(...pagos.map(p => p.id || 0)) + 1 : 1 });
        this.savePayments(pagos);
        this.snackBar.open(t('Pago registrado exitosamente'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  editPayment(index: number): void {
    if (!this.invoice || this.invoice.estado === 'Cancelada') return;
    const payment = this.invoice.pagos?.[index];
    if (!payment) return;

    const dialogRef = this.dialog.open(InvoicePaymentDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: payment
    });

    dialogRef.afterClosed().subscribe((updated: InvoicePayment) => {
      if (updated && this.invoice) {
        const pagos = [...(this.invoice.pagos || [])];
        pagos[index] = { ...updated, id: payment.id };
        this.savePayments(pagos);
        this.snackBar.open(t('Pago actualizado'), t('Cerrar'), { duration: 2000 });
      }
    });
  }

  deletePayment(index: number): void {
    if (!this.invoice || this.invoice.estado === 'Cancelada') return;
    if (!confirm(t('¿Eliminar este pago?'))) return;

    const pagos = (this.invoice.pagos || []).filter((_, i) => i !== index);
    this.savePayments(pagos);
    this.snackBar.open(t('Pago eliminado'), t('Cerrar'), { duration: 2000 });
  }

  editInfo(): void {
    if (!this.invoice) return;

    const dialogRef = this.dialog.open(InvoiceInfoDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: this.invoice
    });

    dialogRef.afterClosed().subscribe((result: InvoiceInfoResult) => {
      if (!result || !this.invoice?.id) return;

      const total = Math.max(0, Math.round(((this.invoice.subtotal || 0) + (this.invoice.impuestos || 0) - (result.descuento || 0)) * 100) / 100);
      const fechaPago = result.estado === 'Pagada'
        ? (result.fechaPago || this.invoice.fechaPago || new Date())
        : undefined;

      const updatedInvoice: Invoice = {
        ...this.invoice,
        estado: result.estado,
        metodoPago: result.metodoPago,
        fechaEmision: result.fechaEmision,
        fechaVencimiento: result.fechaVencimiento,
        fechaPago,
        descuento: result.descuento,
        total,
        notas: result.notas
      };

      this.billingService.updateInvoice(this.invoice.id, updatedInvoice).subscribe({
        next: () => {
          this.snackBar.open(t('Factura actualizada'), t('Cerrar'), { duration: 2000 });
          this.loadInvoice(this.invoice!.id!);
        },
        error: (error) => {
          console.error('Error updating invoice:', error);
          this.snackBar.open(t('Error al actualizar factura'), t('Cerrar'), { duration: 3000 });
        }
      });
    });
  }

  private savePayments(pagos: InvoicePayment[]): void {
    if (!this.invoice?.id) return;

    const updatedInvoice: Invoice = { ...this.invoice, pagos };
    this.syncEstadoFromPayments(updatedInvoice);

    this.billingService.updateInvoice(this.invoice.id, updatedInvoice).subscribe({
      next: () => {
        this.loadInvoice(this.invoice!.id!);
      },
      error: (error) => {
        console.error('Error updating invoice payments:', error);
        this.snackBar.open(t('Error al actualizar factura'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  private syncEstadoFromPayments(invoice: Invoice): void {
    if (invoice.estado === 'Cancelada' || invoice.estado === 'Borrador') return;
    const totalPaid = (invoice.pagos || []).reduce((sum, p) => sum + (p.monto || 0), 0);
    if (totalPaid >= (invoice.total || 0) && (invoice.total || 0) > 0) {
      invoice.estado = 'Pagada';
      if (!invoice.fechaPago) invoice.fechaPago = new Date();
    } else if (invoice.estado === 'Pagada' && totalPaid < (invoice.total || 0)) {
      invoice.estado = 'Enviada';
      invoice.fechaPago = undefined;
    }
  }
}
