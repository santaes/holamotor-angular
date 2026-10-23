import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Invoice } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../../core/services/storage.service';

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

  constructor(
    private fb: FormBuilder,
    private storage: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private billingService: BillingService,
    private snackBar: MatSnackBar
  ) {
    this.invoiceForm = this.createForm();
    this.setupCustomerPicker();
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

  private setupCustomerPicker(): void {
    this.customers = this.storage.getItem<any[]>('customers') || [];
    this.invoiceForm.get('clienteId')?.valueChanges.subscribe(id => {
      const customer = this.customers.find(c => c.id === +id);
      this.vehicles = customer?.vehiculos || [];
      if (customer) {
        this.invoiceForm.patchValue({ clienteNombre: `${customer.nombre} ${customer.apellido}` }, { emitEvent: false });
      }
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
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.snackBar.open('Error al cargar factura', 'Cerrar', { duration: 3000 });
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
        items: [],
        pagos: []
      };

      if (this.isEditMode && this.invoiceId) {
        this.billingService.updateInvoice(this.invoiceId, invoice).subscribe({
          next: () => {
            this.snackBar.open('Factura actualizada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/facturacion']);
          },
          error: (error) => {
            console.error('Error updating invoice:', error);
            this.snackBar.open('Error al actualizar factura', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        this.billingService.createInvoice(invoice).subscribe({
          next: () => {
            this.snackBar.open('Factura creada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/facturacion']);
          },
          error: (error) => {
            console.error('Error creating invoice:', error);
            this.snackBar.open('Error al crear factura', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/facturacion']);
  }

  getErrorMessage(field: string): string {
    const control = this.invoiceForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('min')) {
      return 'Valor mínimo es 0';
    }
    return '';
  }
}
