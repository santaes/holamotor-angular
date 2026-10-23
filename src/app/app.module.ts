import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';

// Feature modules imports
import { DashboardModule } from './features/dashboard/dashboard.module';
import { ClienteModule } from './features/cliente/cliente.module';
import { OrdenReparacionModule } from './features/orden-reparacion/orden-reparacion.module';
import { InventarioModule } from './features/inventario/inventario.module';
import { FacturacionModule } from './features/facturacion/facturacion.module';
import { CitasModule } from './features/citas/citas.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    AppRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTableModule,
    MatCardModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSliderModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatGridListModule,
    MatChipsModule,

    // Feature modules
    DashboardModule,
    ClienteModule,
    OrdenReparacionModule,
    InventarioModule,
    FacturacionModule,
    CitasModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
