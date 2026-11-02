import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Invoice, InvoiceItem } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../../core/services/storage.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { VerifactuService } from '../../../../core/services/verifactu.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { QuickCustomerDialogComponent } from '../../../../core/components/quick-customer-dialog/quick-customer-dialog.component';
import { InvoiceItemDialogComponent } from '../invoice-item-dialog/invoice-item-dialog.component';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm: FormGroup;
  isEditMode = false;
  invoiceId: number | null = null;
  pageTitle = 'Nueva Factura';
  isSendingToVerifactu = false;

  constructor(
    private fb: FormBuilder,
    private storage: StorageService,
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private billingService: BillingService,
    private verifactuService: VerifactuService,
    private snackBar: MatSnackBar
  ) {
    this.invoiceForm = this.createForm();
    this.setupCustomerPicker();
    this.setupTotals();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceId = +id;
      this.isEditMode = true;
      this.pageTitle = 'Editar Factura';
      this.loadInvoice(this.invoiceId);
    }
  }

  customers: any[] = [];
  vehicles: any[] = [];
  items: InvoiceItem[] = [];

  private setupCustomerPicker(): void {
    this.customers = this.storage.getItem<any[]>('customers') || [];
    this.storage.changes$.pipe(takeUntilDestroyed()).subscribe(key => {
      if (key === 'customers') {
        this.customers = this.storage.getItem<any[]>('customers') || [];
        const selected = this.customers.find(c => c.id === +this.invoiceForm.get('clienteId')?.value);
        this.vehicles = selected?.vehiculos || [];
      }
    });
    this.invoiceForm.get('clienteId')?.valueChanges.subscribe(id => {
      const customer = this.customers.find(c => c.id === +id);
      this.vehicles = customer?.vehiculos || [];
      if (customer) {
        this.invoiceForm.patchValue({ clienteNombre: `${customer.nombre} ${customer.apellido}` }, { emitEvent: false });
      }
    });
  }

  /** Tax from Configuración and total are calculated automatically. */
  private setupTotals(): void {
    const f = this.invoiceForm;
    const num = (name: string) => Number(f.get(name)?.value) || 0;

    // When subtotal changes, calculate IVA and total
    f.get('subtotal')?.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const taxRate = this.settingsService.value.taxRate;
      const subtotal = num('subtotal');
      const impuestos = Math.round(subtotal * taxRate) / 100;
      const descuento = num('descuento');
      const total = subtotal + impuestos - descuento;
      f.get('impuestos')?.setValue(impuestos, { emitEvent: false });
      f.get('total')?.setValue(Math.max(0, Math.round(total * 100) / 100), { emitEvent: false });
    });

    // When IVA changes, recalculate total
    f.get('impuestos')?.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const subtotal = num('subtotal');
      const impuestos = num('impuestos');
      const descuento = num('descuento');
      const total = subtotal + impuestos - descuento;
      f.get('total')?.setValue(Math.max(0, Math.round(total * 100) / 100), { emitEvent: false });
    });

    // When total changes, calculate subtotal and IVA backwards
    f.get('total')?.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const taxRate = this.settingsService.value.taxRate;
      const total = num('total');
      const discount = num('descuento');
      // Formula: total = subtotal + (subtotal * taxRate/100) - discount
      // Rearranged: subtotal = (total + discount) / (1 + taxRate/100)
      const subtotal = (total + discount) / (1 + taxRate / 100);
      f.get('subtotal')?.setValue(Math.max(0, Math.round(subtotal * 100) / 100), { emitEvent: false });
      f.get('impuestos')?.setValue(Math.round(num('subtotal') * taxRate) / 100, { emitEvent: false });
    });

    // When discount changes, recalculate total
    f.get('descuento')?.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const subtotal = num('subtotal');
      const impuestos = num('impuestos');
      const descuento = num('descuento');
      const total = subtotal + impuestos - descuento;
      f.get('total')?.setValue(Math.max(0, Math.round(total * 100) / 100), { emitEvent: false });
    });

    // When tax rate changes in settings, recalculate all
    this.settingsService.settings$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.recalculateTotals();
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
        this.invoiceForm.patchValue({ clienteId: customer.id });
        this.snackBar.open(t('Cliente creado y seleccionado'), t('Cerrar'), { duration: 3000 });
      });
  }

  createForm(): FormGroup {
    return this.fb.group({
      numeroFactura: ['', [Validators.required]],
      clienteId: ['', [Validators.required]],
      clienteNombre: ['', [Validators.required]],
      ordenReparacionId: [''],
      numeroOrden: [''],
      fechaEmision: [new Date(), [Validators.required]],
      fechaVencimiento: ['', [Validators.required]],
      fechaPago: [''],
      estado: ['Borrador', [Validators.required]],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      impuestos: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.required, Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      metodoPago: [''],
      notas: ['']
    });
  }

  loadInvoice(id: number): void {
    this.billingService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.invoiceForm.patchValue(invoice);
        this.items = invoice.items || [];
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.snackBar.open(t('Error al cargar factura'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      const invoice: Invoice = {
        ...this.invoiceForm.value,
        fechaEmision: new Date(this.invoiceForm.value.fechaEmision),
        fechaVencimiento: new Date(this.invoiceForm.value.fechaVencimiento),
        fechaPago: this.invoiceForm.value.fechaPago ? new Date(this.invoiceForm.value.fechaPago) : undefined,
        items: this.items,
        pagos: []
      };

      if (this.isEditMode && this.invoiceId) {
        this.billingService.updateInvoice(this.invoiceId, invoice).subscribe({
          next: () => {
            this.snackBar.open(t('Factura actualizada exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/facturacion']);
          },
          error: (error) => {
            console.error('Error updating invoice:', error);
            this.snackBar.open(t('Error al actualizar factura'), t('Cerrar'), { duration: 3000 });
          }
        });
      } else {
        this.billingService.createInvoice(invoice).subscribe({
          next: () => {
            this.snackBar.open(t('Factura creada exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/facturacion']);
          },
          error: (error) => {
            console.error('Error creating invoice:', error);
            this.snackBar.open(t('Error al crear factura'), t('Cerrar'), { duration: 3000 });
          }
        });
      }
    }
  }

  sendToVerifactu(): void {
    if (!this.verifactuService.isConfigured()) {
      this.snackBar.open(t('VeriFactu no está configurado. Ve a Configuración para añadir tu API Key.'), t('Cerrar'), { duration: 5000 });
      return;
    }

    if (!this.invoiceForm.valid) {
      this.snackBar.open(t('Por favor completa la factura antes de enviarla a VeriFactu'), t('Cerrar'), { duration: 3000 });
      return;
    }

    const settings = this.settingsService.value;
    if (!settings.taxId) {
      this.snackBar.open(t('Configura tu NIF/CIF en Configuración antes de enviar a VeriFactu'), t('Cerrar'), { duration: 5000 });
      return;
    }

    this.isSendingToVerifactu = true;

    const invoice: Invoice = {
      ...this.invoiceForm.value,
      fechaEmision: new Date(this.invoiceForm.value.fechaEmision),
      fechaVencimiento: new Date(this.invoiceForm.value.fechaVencimiento),
      fechaPago: this.invoiceForm.value.fechaPago ? new Date(this.invoiceForm.value.fechaPago) : undefined,
      items: this.items,
      pagos: []
    };

    this.billingService.sendToVerifactu(invoice, settings.taxId, settings.workshopName).subscribe({
      next: (response) => {
        this.isSendingToVerifactu = false;
        if (response.data && response.data.estado_registro === 'Correcto') {
          this.snackBar.open(t('Factura enviada a AEAT exitosamente. CSV: ') + response.data.csv, t('Cerrar'), { duration: 5000 });
          console.log('VeriFactu response:', response);
        } else if (response.status === 'success' || response.id) {
          this.snackBar.open(t('Factura enviada a VeriFactu exitosamente. ID: ') + (response.id || 'N/A'), t('Cerrar'), { duration: 5000 });
          console.log('VeriFactu response:', response);
        } else {
          this.snackBar.open(t('Factura rechazada: ') + (response.data?.motivo_rechazo || response.mensaje || 'Error desconocido'), t('Cerrar'), { duration: 5000 });
        }
      },
      error: (error) => {
        this.isSendingToVerifactu = false;
        console.error('Error sending to VeriFactu:', error);
        this.snackBar.open(t('Error al enviar factura a VeriFactu'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/facturacion']);
  }

  getErrorMessage(field: string): string {
    const control = this.invoiceForm.get(field);
    if (control?.hasError('required')) {
      return t('Este campo es requerido');
    }
    if (control?.hasError('min')) {
      return t('Valor mínimo es 0');
    }
    return '';
  }

  addItem(): void {
    const dialogRef = this.dialog.open(InvoiceItemDialogComponent, {
      width: '560px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((item: InvoiceItem) => {
      if (item) {
        const newItem: InvoiceItem = {
          ...item,
          id: this.items.length > 0 ? Math.max(...this.items.map(i => i.id || 0)) + 1 : 1,
          subtotal: item.cantidad * item.precioUnitario
        };
        this.items.push(newItem);
        this.recalculateTotals();
        this.snackBar.open(t('Posición agregada'), t('Cerrar'), { duration: 2000 });
      }
    });
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.recalculateTotals();
    this.snackBar.open(t('Posición eliminada'), t('Cerrar'), { duration: 2000 });
  }

  recalculateTotals(): void {
    const subtotal = this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const taxRate = this.settingsService.value.taxRate;
    const impuestos = Math.round(subtotal * taxRate) / 100;
    const descuento = Number(this.invoiceForm.get('descuento')?.value) || 0;
    const total = subtotal + impuestos - descuento;

    this.invoiceForm.patchValue({
      subtotal: Math.round(subtotal * 100) / 100,
      impuestos: Math.round(impuestos * 100) / 100,
      total: Math.round(total * 100) / 100
    }, { emitEvent: false });
  }
}
