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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { t } from '../../../../core/i18n/i18n';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleWithOwner, VehicleProcedure } from '../../models/vehicle.model';
import { RepairOrder } from '../../../orden-reparacion/models/order.model';
import { Vehicle, VehicleMaintenance } from '../../../cliente/models/customer.model';
import { CarDiagnosis } from '../../../cliente/models/diagnosis.model';
import { DiagnosisService } from '../../../cliente/services/diagnosis.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { AssignVehicleDialogComponent } from '../assign-vehicle-dialog/assign-vehicle-dialog.component';
import { VehicleMaintenanceDialogComponent, MaintenanceDialogData } from '../vehicle-maintenance-dialog/vehicle-maintenance-dialog.component';

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
    MatTooltipModule,
    TranslatePipe,
    MoneyPipe
  ],
  templateUrl: './vehicle-detail.component.html',
  styleUrls: ['./vehicle-detail.component.css']
})
export class VehicleDetailComponent implements OnInit {
  vehicle: VehicleWithOwner | null = null;
  procedures: VehicleProcedure[] = [];
  diagnoses: CarDiagnosis[] = [];
  isLoading = true;
  isUploadingDiagnosis = false;
  expandedDiagnoses = new Set<number>();
  customerId!: number;
  vehicleId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private diagnosisService: DiagnosisService,
    private pdfService: PdfService,
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
        this.loadDiagnoses();
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

  get mantenimientos(): VehicleMaintenance[] {
    return [...(this.vehicle?.mantenimientos || [])].sort((a, b) => {
      const fa = new Date(a.fecha).getTime();
      const fb = new Date(b.fecha).getTime();
      if (fb !== fa) return fb - fa;
      return (b.kilometraje || 0) - (a.kilometraje || 0);
    });
  }

  /** 'vencido' | 'proximo' | 'ok' | null (no next-change data registered) */
  mantenimientoEstado(m: VehicleMaintenance): 'vencido' | 'proximo' | 'ok' | null {
    let estado: 'vencido' | 'proximo' | 'ok' | null = null;
    if (m.proximoCambioKm != null && this.vehicle) {
      const kmRestantes = m.proximoCambioKm - this.vehicle.kilometraje;
      if (kmRestantes <= 0) return 'vencido';
      if (kmRestantes <= 1000) estado = 'proximo';
      else estado = 'ok';
    }
    if (m.proximoCambioFecha) {
      const dias = Math.ceil((new Date(m.proximoCambioFecha).getTime() - Date.now()) / 86400000);
      if (dias <= 0) return 'vencido';
      if (dias <= 30) return estado === 'vencido' ? estado : 'proximo';
      if (estado === null) estado = 'ok';
    }
    return estado;
  }

  mantenimientoDetalle(m: VehicleMaintenance): string {
    const partes: string[] = [];
    if (m.proximoCambioKm != null && this.vehicle) {
      const km = m.proximoCambioKm - this.vehicle.kilometraje;
      partes.push(km > 0
        ? t('Quedan') + ` ${km.toLocaleString('es-ES')} km`
        : t('Vencido por kilometraje'));
    }
    if (m.proximoCambioFecha) {
      const dias = Math.ceil((new Date(m.proximoCambioFecha).getTime() - Date.now()) / 86400000);
      partes.push(dias > 0
        ? t('Quedan') + ` ${dias} ${t('días')}`
        : t('Vencido por fecha'));
    }
    return partes.join(' · ');
  }

  private loadDiagnoses(): void {
    this.diagnosisService.getDiagnoses().subscribe({
      next: (all) => {
        this.diagnoses = all
          .filter(d => d.vehiculoId === this.vehicleId &&
            (this.customerId ? d.clienteId === this.customerId : !d.clienteId))
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      },
      error: () => {}
    });
  }

  onDiagnosisFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.vehicle) return;

    if (file.type !== 'application/pdf') {
      this.snackBar.open(t('Por favor seleccione un archivo PDF'), t('Cerrar'), { duration: 3000 });
      return;
    }

    this.isUploadingDiagnosis = true;
    this.pdfService.uploadPdf(file).subscribe({
      next: (result) => {
        if (!result?.success) {
          this.isUploadingDiagnosis = false;
          this.snackBar.open(t('Error al subir PDF'), t('Cerrar'), { duration: 3000 });
          return;
        }
        const diagnosis: CarDiagnosis = {
          fecha: new Date(),
          titulo: file.name.replace(/\.pdf$/i, ''),
          pdfFilename: result.filename,
          pdfUrl: result.url,
          textoOriginal: '',
          idiomaOriginal: 'auto',
          clienteId: this.customerId || undefined,
          clienteNombre: this.vehicle?.customerName || undefined,
          vehiculoId: this.vehicleId,
          vehiculoInfo: this.vehicle ? `${this.vehicle.marca} ${this.vehicle.modelo} (${this.vehicle.anio})` : undefined
        };
        this.diagnosisService.createDiagnosis(diagnosis).subscribe({
          next: () => {
            this.isUploadingDiagnosis = false;
            this.snackBar.open(t('Diagnóstico subido'), t('Cerrar'), { duration: 3000 });
            this.loadDiagnoses();
          },
          error: () => {
            this.isUploadingDiagnosis = false;
            this.snackBar.open(t('Error al guardar diagnóstico'), t('Cerrar'), { duration: 3000 });
          }
        });
      },
      error: () => {
        this.isUploadingDiagnosis = false;
        this.snackBar.open(t('Error al subir PDF'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  viewDiagnosis(diagnosis: CarDiagnosis): void {
    if (diagnosis.pdfUrl) {
      window.open(diagnosis.pdfUrl, '_blank');
    }
  }

  toggleDiagnosisText(diagnosis: CarDiagnosis): void {
    const id = diagnosis.id!;
    if (this.expandedDiagnoses.has(id)) {
      this.expandedDiagnoses.delete(id);
    } else {
      this.expandedDiagnoses.add(id);
    }
  }

  deleteDiagnosis(diagnosis: CarDiagnosis): void {
    if (!diagnosis.id || !confirm(t('¿Eliminar este diagnóstico?'))) return;
    this.diagnosisService.deleteDiagnosis(diagnosis.id).subscribe({
      next: () => {
        this.snackBar.open(t('Diagnóstico eliminado'), t('Cerrar'), { duration: 2000 });
        this.loadDiagnoses();
      },
      error: () => {
        this.snackBar.open(t('Error al eliminar diagnóstico'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  openMaintenanceDialog(registro?: VehicleMaintenance): void {
    if (!this.vehicle) return;
    const data: MaintenanceDialogData = {
      kilometrajeActual: this.vehicle.kilometraje,
      registro
    };
    this.dialog
      .open(VehicleMaintenanceDialogComponent, { width: '560px', maxWidth: '95vw', data })
      .afterClosed()
      .subscribe((result?: VehicleMaintenance) => {
        if (!result) return;
        const list = [...(this.vehicle!.mantenimientos || [])];
        if (registro?.id != null) {
          const idx = list.findIndex(m => m.id === registro.id);
          if (idx !== -1) {
            list[idx] = { ...result, id: registro.id };
          }
        } else {
          const maxId = list.reduce((max, m) => Math.max(max, m.id || 0), 0);
          list.push({ ...result, id: maxId + 1 });
        }
        this.persistMantenimientos(list);
      });
  }

  deleteMaintenance(registro: VehicleMaintenance): void {
    if (!this.vehicle) return;
    if (!confirm(t('¿Eliminar este registro de mantenimiento?'))) return;
    const list = (this.vehicle.mantenimientos || []).filter(m => m.id !== registro.id);
    this.persistMantenimientos(list);
  }

  private persistMantenimientos(list: VehicleMaintenance[]): void {
    if (!this.vehicle) return;
    // Strip VehicleWithOwner-only fields before persisting
    const { customerName, customerEmail, customerPhone, orderCount, ...vehicle } = this.vehicle;
    const updated: Vehicle = { ...vehicle, mantenimientos: list };
    this.vehicleService.updateVehicle(this.customerId, this.vehicleId, updated).subscribe({
      next: () => {
        this.snackBar.open(t('Mantenimiento guardado'), t('Cerrar'), { duration: 2000 });
        this.loadData();
      },
      error: () => {
        this.snackBar.open(t('Error al guardar mantenimiento'), t('Cerrar'), { duration: 3000 });
      }
    });
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
