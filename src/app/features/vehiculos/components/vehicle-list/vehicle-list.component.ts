import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { t } from '../../../../core/i18n/i18n';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleWithOwner } from '../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css']
})
export class VehicleListComponent implements OnInit {
  vehicles: VehicleWithOwner[] = [];
  filteredVehicles: VehicleWithOwner[] = [];
  searchTerm = '';
  isLoading = true;
  displayedColumns = ['vehiculo', 'placa', 'propietario', 'kilometraje', 'ordenes', 'acciones'];

  constructor(
    private vehicleService: VehicleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredVehicles = term
      ? this.vehicles.filter(v =>
          `${v.marca} ${v.modelo} ${v.anio} ${v.placa} ${v.customerName}`.toLowerCase().includes(term)
        )
      : [...this.vehicles];
  }

  onSearch(): void {
    this.applyFilter();
  }

  vehicleLabel(v: VehicleWithOwner): string {
    return `${v.marca} ${v.modelo} ${v.anio}`;
  }

  confirmDelete(vehicle: VehicleWithOwner): void {
    if (confirm(t('¿Eliminar este vehículo? Esta acción no se puede deshacer.'))) {
      this.vehicleService.deleteVehicle(vehicle.clienteId, vehicle.id!).subscribe({
        next: () => {
          this.snackBar.open(t('Vehículo eliminado'), t('Cerrar'), { duration: 3000 });
          this.loadVehicles();
        },
        error: () => {
          this.snackBar.open(t('Error al eliminar vehículo'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }
}
