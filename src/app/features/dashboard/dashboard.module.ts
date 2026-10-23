import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { MoneyPipe } from '../../core/pipes/money.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard.component';

import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    MatTooltipModule,
    TranslatePipe,
    MoneyPipe,
    CommonModule,
    RouterModule.forChild([
      { path: '', component: DashboardComponent }
    ]),
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressBarModule,
    MatChipsModule
  ]
})
export class DashboardModule {}
