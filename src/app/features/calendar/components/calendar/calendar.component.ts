import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleCalendarService, CalendarEvent } from '../../../../core/services/google-calendar.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { t } from '../../../../core/i18n/i18n';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  template: `
    <div class="calendar-container">
      <div class="header-section">
        <div class="header-content">
          <h1>{{ 'Google Calendar' | t }}</h1>
          <p>{{ 'Eventos y notificaciones de Google Calendar' | t }}</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="connectGoogle()" *ngIf="!isConnected">
            <mat-icon>link</mat-icon>
            {{ 'Conectar Google Calendar' | t }}
          </button>
          <button mat-stroked-button (click)="refreshEvents()" *ngIf="isConnected">
            <mat-icon>refresh</mat-icon>
            {{ 'Actualizar' | t }}
          </button>
        </div>
      </div>

      <div class="calendar-content" *ngIf="isConnected">
        <mat-card class="events-card">
          <mat-card-header>
            <mat-card-title>{{ 'Próximos Eventos' | t }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>{{ 'Cargando eventos...' | t }}</p>
            </div>

            <mat-list *ngIf="!loading && events.length > 0">
              <mat-list-item *ngFor="let event of events">
                <mat-icon matListItemIcon>event</mat-icon>
                <div matListItemTitle>{{ event.summary }}</div>
                <div matListItemLine>
                  {{ (event.start?.dateTime || event.start?.date) | date:'dd/MM/yyyy HH:mm' }}
                  <span *ngIf="event.end?.dateTime"> - {{ event.end.dateTime | date:'HH:mm' }}</span>
                </div>
                <div matListItemLine *ngIf="event.description">{{ event.description }}</div>
                <a matListItemMeta [href]="event.htmlLink" target="_blank">
                  <mat-icon>open_in_new</mat-icon>
                </a>
              </mat-list-item>
            </mat-list>

            <div *ngIf="!loading && events.length === 0" class="no-data">
              <mat-icon>event_busy</mat-icon>
              <p>{{ 'No hay eventos próximos' | t }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="calendar-content" *ngIf="!isConnected">
        <mat-card class="connect-card">
          <mat-card-content>
            <div class="connect-info">
              <mat-icon>calendar_today</mat-icon>
              <h2>{{ 'Conecta tu Google Calendar' | t }}</h2>
              <p>{{ 'Para ver tus eventos y recibir notificaciones de citas' | t }}</p>
              <button mat-raised-button color="primary" (click)="connectGoogle()">
                <mat-icon>link</mat-icon>
                {{ 'Conectar Google Calendar' | t }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--hm-border);
    }

    .header-content h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: var(--hm-text);
    }

    .header-content p {
      margin: 4px 0 0 0;
      color: var(--hm-text-2);
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .calendar-content {
      margin-top: 24px;
    }

    .events-card, .connect-card {
      border-radius: var(--hm-radius-sm);
      box-shadow: var(--hm-shadow);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: var(--hm-text-2);
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: var(--hm-text-3);
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .connect-card {
      text-align: center;
      padding: 40px;
    }

    .connect-info mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--hm-primary);
      margin-bottom: 16px;
    }

    .connect-info h2 {
      margin: 0 0 8px 0;
      color: var(--hm-text);
    }

    .connect-info p {
      margin: 0 0 24px 0;
      color: var(--hm-text-2);
    }
  `]
})
export class CalendarComponent implements OnInit {
  events: CalendarEvent[] = [];
  loading = false;
  isConnected = false;

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkConnection();
  }

  checkConnection(): void {
    this.googleCalendarService.checkConnection().subscribe(connected => {
      this.isConnected = connected;
      if (connected) {
        this.refreshEvents();
      }
      this.cdr.detectChanges();
    });
  }

  connectGoogle(): void {
    // Redirect to Google OAuth
    const authUrl = this.googleCalendarService.getAuthUrl();
    window.location.href = authUrl;
  }

  refreshEvents(): void {
    this.loading = true;
    this.googleCalendarService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
        this.isConnected = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
        if (error?.status === 401) {
          // Token was rejected by Google — ask the user to reconnect
          this.isConnected = false;
          this.snackBar.open(t('La conexión con Google Calendar expiró. Vuelve a conectarla.'), t('Cerrar'), { duration: 5000 });
        } else {
          this.snackBar.open(t('Error al cargar eventos'), t('Cerrar'), { duration: 3000 });
        }
        this.cdr.detectChanges();
      }
    });
  }
}
