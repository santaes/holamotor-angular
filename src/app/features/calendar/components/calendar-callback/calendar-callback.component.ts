import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleCalendarService, CalendarEvent } from '../../../../core/services/google-calendar.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { t } from '../../../../core/i18n/i18n';

@Component({
  selector: 'app-calendar-callback',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslatePipe],
  template: `
    <div class="callback-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ 'Google Calendar' | t }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading" class="loading">
            <mat-icon>hourglass_empty</mat-icon>
            <p>{{ 'Conectando con Google Calendar...' | t }}</p>
          </div>
          <div *ngIf="success" class="success">
            <mat-icon>check_circle</mat-icon>
            <p>{{ 'Conexión exitosa' | t }}</p>
            <button mat-raised-button color="primary" (click)="goToCalendar()">
              {{ 'Ver Calendario' | t }}
            </button>
          </div>
          <div *ngIf="error" class="error">
            <mat-icon>error</mat-icon>
            <p>{{ 'Error al conectar con Google Calendar' | t }}</p>
            <button mat-raised-button color="primary" (click)="retry()">
              {{ 'Reintentar' | t }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    mat-card {
      max-width: 400px;
      width: 100%;
      text-align: center;
    }

    .loading, .success, .error {
      padding: 20px;
    }

    .loading mat-icon, .success mat-icon, .error mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .loading mat-icon {
      color: var(--hm-primary);
    }

    .success mat-icon {
      color: var(--hm-success);
    }

    .error mat-icon {
      color: var(--hm-danger);
    }

    button {
      margin-top: 16px;
    }
  `]
})
export class CalendarCallbackComponent implements OnInit {
  loading = true;
  success = false;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private googleCalendarService: GoogleCalendarService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.authenticate(code);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  authenticate(code: string): void {
    this.googleCalendarService.authenticate(code).subscribe({
      next: (result) => {
        this.loading = false;
        if (result?.success) {
          this.success = true;
          this.snackBar.open(t('Google Calendar conectado exitosamente'), t('Cerrar'), { duration: 3000 });
        } else {
          this.error = true;
        }
      },
      error: (error) => {
        console.error('Auth error:', error);
        this.loading = false;
        this.error = true;
        this.snackBar.open(t('Error al conectar con Google Calendar'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  goToCalendar(): void {
    this.router.navigate(['/calendar']);
  }

  retry(): void {
    window.location.href = this.googleCalendarService.getAuthUrl();
  }
}
