import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InvoiceItem } from '../../models/billing.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';

@Component({
  selector: 'app-invoice-item-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, TranslatePipe, MoneyPipe],
  templateUrl: './invoice-item-dialog.component.html',
  styleUrls: ['./invoice-item-dialog.component.css']
})
export class InvoiceItemDialogComponent {
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    descripcion: ['', [Validators.required, Validators.minLength(2)]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    precioUnitario: [0, [Validators.required, Validators.min(0)]],
    tipo: ['Servicio', [Validators.required]]
  });

  constructor(
    private dialogRef: MatDialogRef<InvoiceItemDialogComponent>
  ) {}

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const item: InvoiceItem = {
      descripcion: v.descripcion.trim(),
      cantidad: Number(v.cantidad),
      precioUnitario: Number(v.precioUnitario),
      subtotal: Number(v.cantidad) * Number(v.precioUnitario),
      tipo: v.tipo as 'Parte' | 'Labor' | 'Servicio'
    };
    this.dialogRef.close(item);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
