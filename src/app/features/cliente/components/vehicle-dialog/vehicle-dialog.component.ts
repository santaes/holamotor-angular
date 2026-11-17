import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Vehicle } from '../../models/customer.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { CarCatalogService } from '../../../../core/services/car-catalog.service';

@Component({
  selector: 'app-vehicle-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatAutocompleteModule, TranslatePipe],
  templateUrl: './vehicle-dialog.component.html'
})
export class VehicleDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly carCatalog = inject(CarCatalogService);

  carMakes = this.carCatalog.getCarMakes();
  makeNames = this.carCatalog.getMakeNames();
  years = this.carCatalog.getYears();

  filteredMakes$!: Observable<string[]>;
  filteredModels$!: Observable<string[]>;

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
  ) {
    const marcaCtrl = this.form.get('marca')!;
    const modeloCtrl = this.form.get('modelo')!;

    this.filteredMakes$ = marcaCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterOptions(this.makeNames, value))
    );

    this.filteredModels$ = combineLatest([
      marcaCtrl.valueChanges.pipe(startWith('')),
      modeloCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([make, model]) => {
        const match = this.carCatalog.findMake(make);
        return match ? this.filterOptions(match.models, model) : [];
      })
    );

    marcaCtrl.valueChanges.subscribe(() => modeloCtrl.setValue(''));
  }

  private filterOptions(options: string[], value: string | null): string[] {
    const v = (value || '').trim().toLowerCase();
    return v ? options.filter(o => o.toLowerCase().includes(v)) : options;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const marca = v.marca.trim();
    const modelo = v.modelo.trim();
    const make = this.carCatalog.findMake(marca);
    const canonicalModel = make?.models.find(m => m.toLowerCase() === modelo.toLowerCase());
    const vehicle: Vehicle = {
      marca: make?.name ?? marca,
      modelo: canonicalModel ?? modelo,
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
