import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Invoice } from '../../models/billing.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { t } from '../../../../core/i18n/i18n';

function toDateInputValue(d: any): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface InvoiceInfoResult {
  estado: Invoice['estado'];
  metodoPago?: Invoice['metodoPago'];
  fechaEmision: Date;
  fechaVencimiento: Date;
  fechaPago?: Date;
  descuento: number;
  notas?: string;
}

@Component({
  selector: 'app-invoice-info-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'Editar Información de la Factura' | t }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'Estado' | t }}</mat-label>
            <mat-select formControlName="estado" required>
              <mat-option value="Borrador">{{ 'Borrador' | t }}</mat-option>
              <mat-option value="Enviada">{{ 'Enviada' | t }}</mat-option>
              <mat-option value="Pagada">{{ 'Pagada' | t }}</mat-option>
              <mat-option value="Vencida">{{ 'Vencida' | t }}</mat-option>
              <mat-option value="Cancelada">{{ 'Cancelada' | t }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'Método de Pago' | t }}</mat-label>
            <mat-select formControlName="metodoPago">
              <mat-option value="">{{ 'Seleccionar' | t }}</mat-option>
              <mat-option value="Efectivo">{{ 'Efectivo' | t }}</mat-option>
              <mat-option value="Tarjeta">{{ 'Tarjeta' | t }}</mat-option>
              <mat-option value="Transferencia">{{ 'Transferencia' | t }}</mat-option>
              <mat-option value="Cheque">{{ 'Cheque' | t }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'Fecha Emisión' | t }}</mat-label>
            <input matInput formControlName="fechaEmision" type="date" required>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'Fecha Vencimiento' | t }}</mat-label>
            <input matInput formControlName="fechaVencimiento" type="date" required>
          </mat-form-field>
        </div>

        <div class="form-row" *ngIf="form.get('estado')?.value === 'Pagada'">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'Fecha Pago' | t }}</mat-label>
            <input matInput formControlName="fechaPago" type="date">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'Descuento' | t }}</mat-label>
            <input matInput formControlName="descuento" type="number" min="0" step="0.01">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'Notas' | t }}</mat-label>
          <textarea matInput formControlName="notas" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ 'Cancelar' | t }}</button>
      <button mat-raised-button color="primary" (click)="save()">
        <mat-icon>save</mat-icon>
        {{ 'Guardar' | t }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .full-width { width: 100%; }
  `]
})
export class InvoiceInfoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InvoiceInfoDialogComponent, InvoiceInfoResult>);

  form = this.fb.group({
    estado: ['Enviada', [Validators.required]],
    metodoPago: [''],
    fechaEmision: ['', [Validators.required]],
    fechaVencimiento: ['', [Validators.required]],
    fechaPago: [''],
    descuento: [0, [Validators.min(0)]],
    notas: ['']
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public invoice: Invoice
  ) {
    this.form.patchValue({
      estado: invoice.estado,
      metodoPago: invoice.metodoPago || '',
      fechaEmision: toDateInputValue(invoice.fechaEmision),
      fechaVencimiento: toDateInputValue(invoice.fechaVencimiento),
      fechaPago: toDateInputValue(invoice.fechaPago),
      descuento: invoice.descuento || 0,
      notas: invoice.notas || ''
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const result: InvoiceInfoResult = {
      estado: v.estado as Invoice['estado'],
      metodoPago: (v.metodoPago || undefined) as Invoice['metodoPago'],
      fechaEmision: new Date(v.fechaEmision),
      fechaVencimiento: new Date(v.fechaVencimiento),
      fechaPago: v.fechaPago ? new Date(v.fechaPago) : undefined,
      descuento: Number(v.descuento) || 0,
      notas: v.notas?.trim() || undefined
    };
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
