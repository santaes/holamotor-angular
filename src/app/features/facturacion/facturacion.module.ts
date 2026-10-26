import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { MoneyPipe } from '../../core/pipes/money.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FacturacionRoutingModule } from './facturacion-routing.module';

import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';
import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ExcelParserService } from './services/excel-parser.service';

@NgModule({
  declarations: [
    InvoiceListComponent,
    InvoiceFormComponent,
    InvoiceDetailComponent
  ],
  imports: [
    MatTooltipModule,
    TranslatePipe,
    MoneyPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FacturacionRoutingModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  providers: [
    ExcelParserService
  ]
})
export class FacturacionModule {}
