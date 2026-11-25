import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { t } from '../../../../core/i18n/i18n';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleWithOwner, VehicleProcedure } from '../../models/vehicle.model';
import { RepairOrder } from '../../../orden-reparacion/models/order.model';
import { AssignVehicleDialogComponent } from '../assign-vehicle-dialog/assign-vehicle-dialog.component';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslatePipe,
    MoneyPipe
  ],
  templateUrl: './vehicle-detail.component.html',
  styleUrls: ['./vehicle-detail.component.css']
})
export class VehicleDetailComponent implements OnInit {
  vehicle: VehicleWithOwner | null = null;
  procedures: VehicleProcedure[] = [];
  isLoading = true;
  customerId!: number;
  vehicleId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.customerId = +this.route.snapshot.paramMap.get('customerId')!;
    this.vehicleId = +this.route.snapshot.paramMap.get('vehicleId')!;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.vehicleService.getVehicleById(this.customerId, this.vehicleId).subscribe({
      next: (vehicle) => {
        this.vehicle = vehicle;
        this.vehicleService.getVehicleHistory(this.customerId, this.vehicleId).subscribe({
          next: (procedures) => {
            this.procedures = procedures;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/vehiculos']);
      }
    });
  }

  get totalSpent(): number {
    return this.procedures.reduce((sum, p) => sum + p.total, 0);
  }

  getEstadoColor(estado: RepairOrder['estado']): string {
    const colors: Record<string, string> = {
      'Pendiente': '#f59e0b',
      'En Progreso': '#3b82f6',
      'Esperando Partes': '#8b5cf6',
      'Listo': '#10b981',
      'Entregado': '#6b7280',
      'Cancelado': '#ef4444'
    };
    return colors[estado] || '#6b7280';
  }

  openAssignDialog(): void {
    if (!this.vehicle?.id) return;
    this.dialog
      .open(AssignVehicleDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: {
          vehicleId: this.vehicle.id,
          vehicleLabel: `${this.vehicle.marca} ${this.vehicle.modelo} ${this.vehicle.anio}`
        }
      })
      .afterClosed()
      .subscribe(customerId => {
        if (!customerId) return;
        this.vehicleService.assignVehicle(this.vehicleId, customerId).subscribe({
          next: (created) => {
            this.snackBar.open(t('Vehículo asignado'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/vehiculos', customerId, created.id ?? this.vehicleId]);
          },
          error: () => {
            this.snackBar.open(t('Error al asignar vehículo'), t('Cerrar'), { duration: 3000 });
          }
        });
      });
  }

  unassignVehicle(): void {
    if (!this.vehicle?.clienteId || this.procedures.length > 0) return;
    if (!confirm(t('¿Quitar el propietario de este vehículo?'))) return;
    this.vehicleService.unassignVehicle(this.customerId, this.vehicleId).subscribe({
      next: (moved) => {
        this.snackBar.open(t('Vehículo sin asignar'), t('Cerrar'), { duration: 3000 });
        this.router.navigate(['/vehiculos', 0, moved.id ?? this.vehicleId]);
      },
      error: () => {
        this.snackBar.open(t('Error al quitar el propietario'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/vehiculos']);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
