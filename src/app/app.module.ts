import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeRu from '@angular/common/locales/ru';
import localeUk from '@angular/common/locales/uk';
import { currentLang, currentLocale } from './core/i18n/i18n';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { MoneyPipe } from './core/pipes/money.pipe';
import { MatBadgeModule } from '@angular/material/badge';

registerLocaleData(localeEs);
registerLocaleData(localeRu);
registerLocaleData(localeUk);
import { AppComponent } from './app.component';
import { StorageService } from './core/services/storage.service';
import { MAT_DATE_LOCALE } from '@angular/material/core';

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


@NgModule({
  declarations: [AppComponent],
  imports: [
    TranslatePipe,
    MoneyPipe,
    MatBadgeModule,
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
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
    MatChipsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: currentLang },
    { provide: MAT_DATE_LOCALE, useValue: currentLocale },
    {
      provide: APP_INITIALIZER,
      useFactory: (storage: StorageService) => () => storage.load(),
      deps: [StorageService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
