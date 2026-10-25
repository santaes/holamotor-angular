import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Customer, Vehicle } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { StorageService } from '../../../../core/services/storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { VehicleDialogComponent } from '../vehicle-dialog/vehicle-dialog.component';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {
  customerForm: FormGroup;
  isEditMode = false;
  customerId: number | null = null;
  pageTitle = 'Nuevo Cliente';
  vehicles: Vehicle[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.customerForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId = +id;
      this.isEditMode = true;
      this.pageTitle = 'Editar Cliente';
      this.loadCustomer(this.customerId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', Validators.minLength(2)],
      email: ['', Validators.email],
      telefono: ['', Validators.pattern(/^(\+[0-9]{1,3}[- ]?)?[0-9]{9,15}$/)],
      direccion: [''],
      ciudad: [''],
      codigoPostal: ['', Validators.pattern(/^[0-9]{5}$/)],
      notas: [''],
      lealtadPuntos: [0, [Validators.min(0)]],
      nivelLealtad: ['Bronce'],
      estado: ['Activo']
    });
  }

  loadCustomer(id: number): void {
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.customerForm.patchValue(customer);
        this.vehicles = customer.vehiculos || [];
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.snackBar.open(t('Error al cargar cliente'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      const customer: Customer = {
        ...this.customerForm.value,
        fechaRegistro: this.isEditMode ? new Date() : new Date(),
        vehiculos: this.vehicles
      };

      if (this.isEditMode && this.customerId) {
        this.customerService.updateCustomer(this.customerId, customer).subscribe({
          next: () => {
            this.snackBar.open(t('Cliente actualizado exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/clientes']);
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.snackBar.open(t('Error al actualizar cliente'), t('Cerrar'), { duration: 3000 });
          }
        });
      } else {
        this.customerService.createCustomer(customer).subscribe({
          next: () => {
            this.snackBar.open(t('Cliente creado exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/clientes']);
          },
          error: (error) => {
            console.error('Error creating customer:', error);
            this.snackBar.open(t('Error al crear cliente'), t('Cerrar'), { duration: 3000 });
          }
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/clientes']);
  }

  getErrorMessage(field: string): string {
    const control = this.customerForm.get(field);
    if (control?.hasError('required')) {
      return t('Este campo es requerido');
    }
    if (control?.hasError('email')) {
      return t('Email inválido');
    }
    if (control?.hasError('pattern')) {
      if (field === 'telefono') {
        return t('Formato: +34 600123456 o 600123456');
      }
      return t('Formato inválido');
    }
    if (control?.hasError('minlength')) {
      return t('Mínimo 2 caracteres');
    }
    return '';
  }

  addVehicle(): void {
    const dialogRef = this.dialog.open(VehicleDialogComponent, {
      width: '560px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((vehicle: Vehicle) => {
      if (vehicle) {
        const newVehicle: Vehicle = {
          ...vehicle,
          id: this.vehicles.length > 0 ? Math.max(...this.vehicles.map(v => v.id || 0)) + 1 : 1,
          clienteId: this.customerId || 0
        };
        this.vehicles.push(newVehicle);
        this.snackBar.open(t('Vehículo agregado'), t('Cerrar'), { duration: 2000 });
      }
    });
  }

  removeVehicle(index: number): void {
    this.vehicles.splice(index, 1);
    this.snackBar.open(t('Vehículo eliminado'), t('Cerrar'), { duration: 2000 });
  }
}
