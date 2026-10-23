import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { MoneyPipe } from '../../core/pipes/money.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { InventarioRoutingModule } from './inventario-routing.module';

import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { InventoryFormComponent } from './components/inventory-form/inventory-form.component';
import { InventoryDetailComponent } from './components/inventory-detail/inventory-detail.component';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    InventoryListComponent,
    InventoryFormComponent,
    InventoryDetailComponent
  ],
  imports: [
    MatTooltipModule,
    TranslatePipe,
    MoneyPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InventarioRoutingModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ]
})
export class InventarioModule {}
