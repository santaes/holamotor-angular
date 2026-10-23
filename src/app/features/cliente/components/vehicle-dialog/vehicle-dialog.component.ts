import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Vehicle } from '../../models/customer.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-vehicle-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './vehicle-dialog.component.html'
})
export class VehicleDialogComponent {
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    marca: ['', [Validators.required, Validators.minLength(2)]],
    modelo: ['', [Validators.required, Validators.minLength(2)]],
    anio: [null as number | null, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
    placa: ['', [Validators.required, Validators.minLength(3)]],
    vin: [''],
    color: [''],
    kilometraje: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private dialogRef: MatDialogRef<VehicleDialogComponent>
  ) {}

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const vehicle: Vehicle = {
      marca: v.marca.trim(),
      modelo: v.modelo.trim(),
      anio: Number(v.anio),
      placa: v.placa.trim().toUpperCase(),
      vin: v.vin?.trim() || '',
      color: v.color?.trim() || '',
      kilometraje: Number(v.kilometraje),
      clienteId: 0 // Will be set by parent
    };
    this.dialogRef.close(vehicle);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
