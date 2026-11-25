import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { VehicleService } from '../../services/vehicle.service';
import { Customer } from '../../../cliente/models/customer.model';
import { QuickCustomerDialogComponent } from '../../../../core/components/quick-customer-dialog/quick-customer-dialog.component';

export interface AssignVehicleDialogData {
  vehicleId: number;
  vehicleLabel?: string;
}

/** Pick an existing customer (or create one) to own an unassigned vehicle. */
@Component({
  selector: 'app-assign-vehicle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe
  ],
  template: `
    <h2 mat-dialog-title><mat-icon>person_add</mat-icon> {{ 'Asignar cliente' | t }}</h2>
    <mat-dialog-content>
      <p class="vehicle-label" *ngIf="data.vehicleLabel">{{ data.vehicleLabel }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'Cliente' | t }}</mat-label>
        <mat-select [(ngModel)]="selectedCustomerId">
          <mat-option *ngFor="let c of customers" [value]="c.id">
            {{ c.nombre }} {{ c.apellido || '' }} · {{ c.telefono }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="addCustomer()">
        <mat-icon>person_add</mat-icon> {{ 'Nuevo cliente' | t }}
      </button>
      <span class="spacer"></span>
      <button mat-button type="button" mat-dialog-close>{{ 'Cancelar' | t }}</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!selectedCustomerId" (click)="confirm()">
        <mat-icon>check</mat-icon> {{ 'Asignar' | t }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .vehicle-label { color: rgba(0,0,0,.6); margin: 0 0 8px; }
    .spacer { flex: 1; }
  `]
})
export class AssignVehicleDialogComponent {
  data = inject<AssignVehicleDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AssignVehicleDialogComponent>);
  private vehicleService = inject(VehicleService);
  private dialog = inject(MatDialog);

  customers: Customer[] = [];
  selectedCustomerId: number | null = null;

  constructor() {
    this.vehicleService.getCustomers().subscribe(c => (this.customers = c));
  }

  addCustomer(): void {
    this.dialog
      .open(QuickCustomerDialogComponent, { width: '560px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(customer => {
        if (!customer) return;
        this.vehicleService.getCustomers().subscribe(c => (this.customers = c));
        this.selectedCustomerId = customer.id ?? null;
      });
  }

  confirm(): void {
    if (!this.selectedCustomerId) return;
    this.dialogRef.close(this.selectedCustomerId);
  }
}
