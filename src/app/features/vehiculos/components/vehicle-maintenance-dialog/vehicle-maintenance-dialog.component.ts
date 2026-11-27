import { Component, inject, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { VehicleMaintenance } from '../../../cliente/models/customer.model';

export interface MaintenanceDialogData {
  kilometrajeActual?: number;
  registro?: VehicleMaintenance;
}

@Component({
  selector: 'app-vehicle-maintenance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslatePipe
  ],
  templateUrl: './vehicle-maintenance-dialog.component.html',
  styleUrls: ['./vehicle-maintenance-dialog.component.css']
})
export class VehicleMaintenanceDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<VehicleMaintenanceDialogComponent>);

  tipos: VehicleMaintenance['tipo'][] = [
    'Aceite',
    'Filtro de aceite',
    'Filtro de aire',
    'Filtro de habitáculo',
    'Pastillas de freno',
    'Neumáticos',
    'Otro'
  ];

  kilometrajeActual = 0;
  isEdit = false;

  form = this.fb.group({
    tipo: ['Aceite' as VehicleMaintenance['tipo'], [Validators.required]],
    fecha: [new Date() as Date | null, [Validators.required]],
    kilometraje: [0, [Validators.required, Validators.min(0)]],
    proximoCambioKm: [null as number | null, [Validators.min(0)]],
    proximoCambioFecha: [null as Date | null],
    notas: ['']
  });

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data?: MaintenanceDialogData
  ) {
    this.kilometrajeActual = data?.kilometrajeActual || 0;
    if (data?.registro) {
      this.isEdit = true;
      const r = data.registro;
      this.form.patchValue({
        tipo: r.tipo,
        fecha: r.fecha ? new Date(r.fecha) : new Date(),
        kilometraje: r.kilometraje,
        proximoCambioKm: r.proximoCambioKm ?? null,
        proximoCambioFecha: r.proximoCambioFecha ? new Date(r.proximoCambioFecha) : null,
        notas: r.notas || ''
      });
    } else if (this.kilometrajeActual > 0) {
      this.form.patchValue({ kilometraje: this.kilometrajeActual });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const registro: VehicleMaintenance = {
      tipo: v.tipo!,
      fecha: v.fecha!,
      kilometraje: Number(v.kilometraje),
      proximoCambioKm: v.proximoCambioKm != null ? Number(v.proximoCambioKm) : undefined,
      proximoCambioFecha: v.proximoCambioFecha || undefined,
      notas: v.notas?.trim() || undefined
    };
    this.dialogRef.close(registro);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
