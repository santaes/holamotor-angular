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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { t } from '../../../../core/i18n/i18n';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleLookupService, VehicleLookupResult } from '../../services/vehicle-lookup.service';
import { CarCatalogService } from '../../../../core/services/car-catalog.service';
import { Customer, Vehicle } from '../../../cliente/models/customer.model';

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
    MatTooltipModule,
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
  isLookingUpVin = false;
  isLookingUpPlate = false;

  filteredMakes$!: Observable<string[]>;
  filteredModels$!: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private vehicleLookup: VehicleLookupService,
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
      // 0 = "Sin asignar": vehicles may be created before a customer is known
      clienteId: [0],
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

  lookupVin(): void {
    const vin = (this.form.get('vin')?.value || '').trim();
    if (vin.replace(/[^a-zA-Z0-9]/g, '').length < 11) {
      this.snackBar.open(t('Introduce un VIN válido (mínimo 11 caracteres)'), t('Cerrar'), { duration: 3500 });
      return;
    }
    this.isLookingUpVin = true;
    this.vehicleLookup.lookupByVin(vin).subscribe({
      next: (result) => {
        this.isLookingUpVin = false;
        if (result.found && result.marca && result.modelo) {
          this.applyLookupResult(result);
          this.snackBar.open(t('Datos del vehículo cargados'), t('Cerrar'), { duration: 3000 });
        } else {
          this.snackBar.open(t('No se encontraron datos para ese VIN'), t('Cerrar'), { duration: 4000 });
        }
      },
      error: () => {
        this.isLookingUpVin = false;
        this.snackBar.open(t('Error al consultar el VIN'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  lookupPlate(): void {
    const plate = (this.form.get('placa')?.value || '').trim();
    if (plate.replace(/[\s-]/g, '').length < 4) {
      this.snackBar.open(t('Introduce una matrícula válida'), t('Cerrar'), { duration: 3000 });
      return;
    }
    this.isLookingUpPlate = true;
    this.vehicleLookup.lookupByPlate(plate).subscribe({
      next: (result) => {
        this.isLookingUpPlate = false;
        if (result.found && result.marca && result.modelo) {
          this.applyLookupResult(result);
          const owner = result.localMatches?.[0]?.customerName;
          this.snackBar.open(
            owner ? t('Datos cargados — esta matrícula ya está registrada a nombre de') + ' ' + owner
                  : t('Datos del vehículo cargados'),
            t('Cerrar'),
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(
            result.localMatches?.length
              ? t('Matrícula ya registrada en el taller')
              : t('No se encontraron datos para esa matrícula'),
            t('Cerrar'),
            { duration: 4000 }
          );
        }
      },
      error: () => {
        this.isLookingUpPlate = false;
        this.snackBar.open(t('Error al consultar la matrícula'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  private applyLookupResult(result: VehicleLookupResult): void {
    // Canonicalize against the catalog so autocomplete/display use official names
    // (NHTSA returns e.g. "HONDA" while the catalog has "Honda").
    const make = result.marca ? this.carCatalog.findMake(result.marca) : undefined;
    const canonicalModel = make?.models.find(m =>
      m.toLowerCase() === (result.modelo || '').toLowerCase()
    );

    // marca must be patched before modelo: changing marca resets modelo in setupCatalogFilters.
    const patch: Record<string, unknown> = {};
    if (result.marca) patch['marca'] = make?.name ?? result.marca;
    if (result.modelo) patch['modelo'] = canonicalModel ?? result.modelo;
    if (result.anio) patch['anio'] = result.anio;
    if (result.color) patch['color'] = result.color;
    if (result.vin) patch['vin'] = result.vin;
    this.form.patchValue(patch);
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
        // Owner stays editable only while the vehicle has no owner yet —
        // picking one here assigns the vehicle to that customer.
        if (this.customerId) {
          this.form.get('clienteId')?.disable();
        }
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
      clienteId: Number(v.clienteId) || 0
    };

    let request: Observable<Vehicle>;
    if (this.isEditMode && !this.customerId && vehicle.clienteId > 0) {
      // Unassigned vehicle being given an owner: move it into that customer's garage
      request = this.vehicleService.assignVehicle(this.vehicleId!, vehicle.clienteId, vehicle);
    } else if (this.isEditMode) {
      request = this.vehicleService.updateVehicle(this.customerId!, this.vehicleId!, vehicle);
    } else {
      request = this.vehicleService.addVehicle(Number(v.clienteId) || null, vehicle);
    }

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
