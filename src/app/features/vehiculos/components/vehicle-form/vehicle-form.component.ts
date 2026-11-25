import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { t } from '../../../../core/i18n/i18n';
import { VehicleService } from '../../services/vehicle.service';
import { CarCatalogService } from '../../../../core/services/car-catalog.service';
import { Customer } from '../../../cliente/models/customer.model';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    TranslatePipe
  ],
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.css']
})
export class VehicleFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  isLoading = false;
  customerId: number | null = null;
  vehicleId: number | null = null;
  customers: Customer[] = [];
  pageTitle = 'Añadir Vehículo';

  carMakes: any[] = [];
  makeNames: string[] = [];
  years: number[] = [];

  filteredMakes$!: Observable<string[]>;
  filteredModels$!: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private carCatalog: CarCatalogService,
    private snackBar: MatSnackBar
  ) {
    this.carMakes = this.carCatalog.getCarMakes();
    this.makeNames = this.carCatalog.getMakeNames();
    this.years = this.carCatalog.getYears();
    this.form = this.createForm();
    this.setupCatalogFilters();
  }

  ngOnInit(): void {
    this.vehicleService.getCustomers().subscribe(c => (this.customers = c));

    const cid = this.route.snapshot.paramMap.get('customerId');
    const vid = this.route.snapshot.paramMap.get('vehicleId');

    if (cid && vid) {
      this.isEditMode = true;
      this.customerId = +cid;
      this.vehicleId = +vid;
      this.pageTitle = 'Editar Vehículo';
      this.loadVehicle();
    } else {
      const preselected = this.route.snapshot.queryParamMap.get('clienteId');
      if (preselected) {
        this.form.patchValue({ clienteId: +preselected });
      }
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      clienteId: [null, [Validators.required]],
      marca: ['', [Validators.required, Validators.minLength(2)]],
      modelo: ['', [Validators.required, Validators.minLength(2)]],
      anio: [null as number | null, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      placa: ['', [Validators.required, Validators.minLength(3)]],
      vin: [''],
      color: [''],
      kilometraje: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private setupCatalogFilters(): void {
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

    marcaCtrl.valueChanges.subscribe(() => {
      modeloCtrl.setValue('');
      if (marcaCtrl.value) {
        modeloCtrl.enable({ emitEvent: false });
      } else {
        modeloCtrl.disable({ emitEvent: false });
      }
    });

    if (!marcaCtrl.value) {
      modeloCtrl.disable({ emitEvent: false });
    }
  }

  private filterOptions(options: string[], value: string | null): string[] {
    const v = (value || '').trim().toLowerCase();
    return v ? options.filter(o => o.toLowerCase().includes(v)) : options;
  }

  loadVehicle(): void {
    if (!this.customerId || !this.vehicleId) return;
    this.vehicleService.getVehicleById(this.customerId, this.vehicleId).subscribe({
      next: (vehicle) => {
        this.form.patchValue({
          clienteId: this.customerId,
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          anio: vehicle.anio,
          placa: vehicle.placa,
          vin: vehicle.vin || '',
          color: vehicle.color || '',
          kilometraje: vehicle.kilometraje || 0
        });
        this.form.get('clienteId')?.disable();
      },
      error: () => {
        this.snackBar.open(t('Error al cargar vehículo'), t('Cerrar'), { duration: 3000 });
        this.router.navigate(['/vehiculos']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const v = this.form.getRawValue();
    const marca = v.marca.trim();
    const modelo = v.modelo.trim();
    const make = this.carCatalog.findMake(marca);
    const canonicalModel = make?.models.find(m => m.toLowerCase() === modelo.toLowerCase());

    const vehicle = {
      marca: make?.name ?? marca,
      modelo: canonicalModel ?? modelo,
      anio: Number(v.anio),
      placa: v.placa.trim().toUpperCase(),
      vin: v.vin?.trim() || '',
      color: v.color?.trim() || '',
      kilometraje: Number(v.kilometraje),
      clienteId: Number(v.clienteId)
    };

    const targetCustomerId = this.isEditMode ? this.customerId! : Number(v.clienteId);

    const request = this.isEditMode
      ? this.vehicleService.updateVehicle(this.customerId!, this.vehicleId!, vehicle)
      : this.vehicleService.addVehicle(targetCustomerId, vehicle);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open(
          this.isEditMode ? t('Vehículo actualizado') : t('Vehículo añadido'),
          t('Cerrar'),
          { duration: 3000 }
        );
        this.router.navigate(['/vehiculos']);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open(t('Error al guardar vehículo'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/vehiculos']);
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError('required')) {
      return t('Este campo es requerido');
    }
    if (control?.hasError('minlength')) {
      return t('Mínimo 2 caracteres');
    }
    return '';
  }
}
