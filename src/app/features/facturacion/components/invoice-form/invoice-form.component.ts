import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as QRCode from 'qrcode';
import { ReactiveFormsModule } from '@angular/forms';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { t } from '../../../../core/i18n/i18n';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Invoice, InvoiceItem } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../../core/services/storage.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { VerifactuService, CertificateInfo } from '../../../../core/services/verifactu.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { QuickCustomerDialogComponent } from '../../../../core/components/quick-customer-dialog/quick-customer-dialog.component';
import { InvoiceItemDialogComponent } from '../invoice-item-dialog/invoice-item-dialog.component';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCheckboxModule,
    TranslatePipe,
    MoneyPipe,
    ReactiveFormsModule],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm: FormGroup;
  isEditMode = false;
  invoiceId: number | null = null;
  pageTitle = 'Nueva Factura';
  isSendingToVerifactu = false;
  certificateInfo: CertificateInfo | null = null;
  qrCode: string = '';
  qrCodeImage: SafeResourceUrl | null = null;
  isSandboxMode = false;

  constructor(
    private fb: FormBuilder,
    private storage: StorageService,
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private billingService: BillingService,
    private verifactuService: VerifactuService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
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
    this.checkCertificateStatus();
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
        // Create new array reference to trigger change detection
        this.items = [...(invoice.items || [])];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.snackBar.open(t('Error al cargar factura'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      const formValue = this.invoiceForm.value;
      const invoice: Invoice = {
        ...formValue,
        fechaEmision: new Date(formValue.fechaEmision),
        fechaVencimiento: new Date(formValue.fechaVencimiento),
        fechaPago: formValue.fechaPago ? new Date(formValue.fechaPago) : undefined,
        items: this.items,
        pagos: this.createPaymentsFromForm(formValue)
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
      this.snackBar.open(t('VeriFactu no está configurado. Carga tu certificado digital y configura tu NIF/CIF.'), t('Cerrar'), { duration: 5000 });
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

    const formValue = this.invoiceForm.value;
    const invoice: Invoice = {
      ...formValue,
      fechaEmision: new Date(formValue.fechaEmision),
      fechaVencimiento: new Date(formValue.fechaVencimiento),
      fechaPago: formValue.fechaPago ? new Date(formValue.fechaPago) : undefined,
      items: this.items,
      pagos: this.createPaymentsFromForm(formValue)
    };

    // Prepare AEAT-compliant request
    const aeatRequest = {
      serie: invoice.numeroFactura.split('-')[0] || 'A',
      numero: invoice.numeroFactura.split('-')[1] || invoice.numeroFactura,
      fecha_expedicion: invoice.fechaEmision.toISOString().split('T')[0],
      fecha_operacion: invoice.fechaEmision.toISOString().split('T')[0],
      emisor: {
        nif: settings.taxId,
        nombre: settings.workshopName || 'Taller',
        nombre_comercial: settings.workshopName || 'Taller'
      },
      receptor: {
        nif: this.getCustomerNIF(invoice.clienteId),
        nombre: invoice.clienteNombre,
        direccion: this.getCustomerAddress(invoice.clienteId),
        provincia: this.getCustomerProvince(invoice.clienteId),
        pais: 'ES',
        codigo_postal: this.getCustomerPostalCode(invoice.clienteId)
      },
      lineas: invoice.items.map(item => ({
        concepto: item.descripcion,
        cantidad: item.cantidad,
        precio: item.precioUnitario,
        tipo_iva: this.getIVAType(item.tipoIVA),
        descuento: item.descuento || 0
      })),
      tipo_factura: 'F1' as const,
      clave_regimen_iva: 'S1',
      importe_total: invoice.total,
      fecha_vencimiento: invoice.fechaVencimiento.toISOString().split('T')[0],
      descripcion: invoice.notas || 'Servicios de taller'
    };

    this.verifactuService.createInvoice(aeatRequest).subscribe({
      next: (response) => {
        this.isSendingToVerifactu = false;
        if (response.status === 'success' || response.id) {
          this.snackBar.open(t('Factura enviada a AEAT exitosamente. ID: ') + (response.id || 'N/A'), t('Cerrar'), { duration: 5000 });
          
          // Generate QR code
          if (response.qr_code) {
            this.qrCode = response.qr_code;
            this.generateQRCodeImage(response.qr_code).then(qrImage => {
              this.qrCodeImage = qrImage;
              this.cdr.detectChanges();
            });
          }
          
          console.log('AEAT VeriFactu response:', response);
          this.cdr.detectChanges();
        } else {
          this.snackBar.open(t('Factura rechazada: ') + (response.mensaje || 'Error desconocido'), t('Cerrar'), { duration: 5000 });
        }
      },
      error: (error) => {
        this.isSendingToVerifactu = false;
        console.error('Error sending to AEAT VeriFactu:', error);
        this.snackBar.open(t('Error al enviar factura a AEAT VeriFactu'), t('Cerrar'), { duration: 3000 });
      }
    });
  }
  
  private checkCertificateStatus(): void {
    setTimeout(() => {
      this.certificateInfo = this.verifactuService.getCertificateInfo();
      this.isSandboxMode = this.verifactuService.isSandboxMode();
      this.cdr.detectChanges();
    });
  }
  
  isCertificateLoadedInSession(): boolean {
    return this.verifactuService.isSessionLoaded();
  }
  
  clearCertificate(): void {
    this.verifactuService.clearCertificate();
    this.certificateInfo = null;
    this.snackBar.open(t('Certificado eliminado de la sesión'), t('Cerrar'), { duration: 3000 });
    this.cdr.detectChanges();
  }
  
  private async generateQRCodeImage(data: string): Promise<SafeResourceUrl> {
    try {
      // Decode the base64 data
      const qrData = atob(data);
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      return this.sanitizer.bypassSecurityTrustResourceUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to external API if local generation fails
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(qrUrl);
    }
  }
  
  async onCertificateUpload(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;
    
    const password = prompt(t('Introduce la contraseña del certificado:'));
    if (!password) return;
    
    try {
      const info = await this.verifactuService.loadCertificate(file, password);
      this.certificateInfo = info;
      this.snackBar.open(t('Certificado cargado exitosamente'), t('Cerrar'), { duration: 3000 });
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading certificate:', error);
      this.snackBar.open(t('Error al cargar certificado: ') + (error instanceof Error ? error.message : 'Unknown error'), t('Cerrar'), { duration: 5000 });
    }
  }
  
  private createPaymentsFromForm(formValue: any): any[] {
    // If invoice is paid, create a payment record
    if (formValue.estado === 'Pagada' && formValue.total > 0) {
      const paymentMethod = formValue.metodoPago || 'Efectivo';
      const validMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque'];
      const metodo = validMethods.includes(paymentMethod) ? paymentMethod : 'Efectivo';
      
      return [{
        id: 1,
        monto: formValue.total,
        metodo: metodo,
        fecha: formValue.fechaPago ? new Date(formValue.fechaPago) : new Date(),
        referencia: `Pago factura ${formValue.numeroFactura}`,
        notas: 'Pago automático al marcar como pagada'
      }];
    }
    return [];
  }

  private getCustomerNIF(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer?.nif || customer?.documento || '00000000X';
  }
  
  private getCustomerAddress(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer?.direccion || '';
  }
  
  private getCustomerProvince(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer?.ciudad || '';
  }
  
  private getCustomerPostalCode(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer?.codigoPostal || '';
  }
  
  private getIVAType(tipoIVA?: string): string {
    const ivaMap: { [key: string]: string } = {
      '4': '4',
      '10': '10',
      '21': '21'
    };
    return ivaMap[tipoIVA || '21'] || '21';
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
        // Create new array reference to trigger change detection
        this.items = [...this.items, newItem];
        this.recalculateTotals();
        this.snackBar.open(t('Posición agregada'), t('Cerrar'), { duration: 2000 });
        this.cdr.detectChanges();
      }
    });
  }

  removeItem(index: number): void {
    // Create new array reference to trigger change detection
    this.items = this.items.filter((_, i) => i !== index);
    this.recalculateTotals();
    this.snackBar.open(t('Posición eliminada'), t('Cerrar'), { duration: 2000 });
    this.cdr.detectChanges();
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
