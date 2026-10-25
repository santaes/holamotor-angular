import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { StorageService } from '../../services/storage.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CarCatalogService } from '../../services/car-catalog.service';

/** Small dialog to register a customer (and optionally a vehicle) without leaving the current form. */
@Component({
  selector: 'app-quick-customer-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, TranslatePipe],
  templateUrl: './quick-customer-dialog.component.html'
})
export class QuickCustomerDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly carCatalog = inject(CarCatalogService);

  carMakes = this.carCatalog.getCarMakes();
  years = this.carCatalog.getYears();
  filteredModels: string[] = [];

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', Validators.required],
    telefono: ['', Validators.required],
    email: ['', Validators.email],
    marca: [''],
    modelo: [''],
    anio: [null as number | null],
    placa: ['']
  });

  constructor(
    private storage: StorageService,
    private dialogRef: MatDialogRef<QuickCustomerDialogComponent>
  ) {
    this.form.get('marca')?.valueChanges.subscribe(make => {
      if (make) {
        this.filteredModels = this.carCatalog.getModelsByMake(make);
        this.form.get('modelo')?.setValue('');
      } else {
        this.filteredModels = [];
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const customers = this.storage.getItem<any[]>('customers') || [];
    const id = Math.max(0, ...customers.map(c => Number(c.id) || 0)) + 1;
    const vehicles = [];
    if (v.marca || v.modelo || v.placa) {
      const vehicleId = Math.max(0, ...customers.flatMap(c => c.vehiculos || []).map((x: any) => Number(x.id) || 0)) + 1;
      vehicles.push({
        id: vehicleId,
        marca: v.marca || '',
        modelo: v.modelo || '',
        anio: Number(v.anio) || new Date().getFullYear(),
        placa: (v.placa || '').toUpperCase(),
        color: '',
        kilometraje: 0,
        clienteId: id
      });
    }
    const customer = {
      id,
      nombre: (v.nombre || '').trim(),
      apellido: (v.apellido || '').trim(),
      email: (v.email || '').trim(),
      telefono: (v.telefono || '').trim(),
      direccion: '',
      ciudad: '',
      codigoPostal: '',
      fechaRegistro: new Date(),
      lealtadPuntos: 0,
      nivelLealtad: 'Bronce',
      estado: 'Activo',
      vehiculos: vehicles,
      historialComunicaciones: []
    };
    this.storage.setItem('customers', [...customers, customer]);
    this.dialogRef.close(customer);
  }
}
