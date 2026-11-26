import { Component, inject, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InvoicePayment } from '../../models/billing.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

function toDateInputValue(d: any): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

@Component({
  selector: 'app-invoice-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ (isEdit ? 'Editar Pago' : 'Agregar Pago') | t }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'Monto' | t }}</mat-label>
            <input matInput formControlName="monto" type="number" min="0.01" step="0.01" required>
            <mat-error *ngIf="form.get('monto')?.hasError('required')">{{ 'Este campo es requerido' | t }}</mat-error>
            <mat-error *ngIf="form.get('monto')?.hasError('min')">{{ 'Valor mínimo es 0.01' | t }}</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'Método' | t }}</mat-label>
            <mat-select formControlName="metodo" required>
              <mat-option value="Efectivo">{{ 'Efectivo' | t }}</mat-option>
              <mat-option value="Tarjeta">{{ 'Tarjeta' | t }}</mat-option>
              <mat-option value="Transferencia">{{ 'Transferencia' | t }}</mat-option>
              <mat-option value="Cheque">{{ 'Cheque' | t }}</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('metodo')?.hasError('required')">{{ 'Este campo es requerido' | t }}</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'Fecha' | t }}</mat-label>
          <input matInput formControlName="fecha" type="datetime-local" required>
          <mat-error *ngIf="form.get('fecha')?.hasError('required')">{{ 'Este campo es requerido' | t }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'Referencia' | t }}</mat-label>
          <input matInput formControlName="referencia">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'Notas' | t }}</mat-label>
          <textarea matInput formControlName="notas" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ 'Cancelar' | t }}</button>
      <button mat-raised-button color="primary" (click)="save()">
        <mat-icon>{{ isEdit ? 'save' : 'add' }}</mat-icon>
        {{ (isEdit ? 'Guardar' : 'Agregar') | t }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .full-width { width: 100%; }
  `]
})
export class InvoicePaymentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InvoicePaymentDialogComponent>);

  isEdit = false;

  form = this.fb.group({
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodo: ['Efectivo', [Validators.required]],
    fecha: [toDateInputValue(new Date()), [Validators.required]],
    referencia: [''],
    notas: ['']
  });

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data?: InvoicePayment
  ) {
    if (data) {
      this.isEdit = true;
      this.form.patchValue({
        monto: data.monto,
        metodo: data.metodo,
        fecha: toDateInputValue(data.fecha),
        referencia: data.referencia || '',
        notas: data.notas || ''
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payment: InvoicePayment = {
      monto: Number(v.monto),
      metodo: v.metodo as InvoicePayment['metodo'],
      fecha: new Date(v.fecha),
      referencia: v.referencia?.trim() || undefined,
      notas: v.notas?.trim() || undefined
    };
    this.dialogRef.close(payment);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
