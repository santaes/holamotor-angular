import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private apiUrl = '/api/calendar';

  constructor(private http: HttpClient) {}

  authenticate(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth`, { code, redirectUri: this.getRedirectUri() }).pipe(
      catchError(error => {
        console.error('Google auth error:', error.error?.detail || error.error || error);
        return of(null);
      })
    );
  }

  getEvents(): Observable<CalendarEvent[]> {
    return this.http.get<any>(`${this.apiUrl}/events`, {
      params: { singleEvents: 'true', orderBy: 'startTime' }
    }).pipe(
      map(response => {
        const events: CalendarEvent[] = Array.isArray(response) ? response : response?.items || [];
        const now = Date.now();
        const toTime = (dateTime?: string, date?: string) => {
          const raw = dateTime || date;
          if (!raw) return 0;
          return new Date(dateTime ? raw : raw + 'T00:00:00').getTime();
        };
        const startTime = (e: CalendarEvent) => toTime(e.start?.dateTime, e.start?.date);
        const endTime = (e: CalendarEvent) => toTime(e.end?.dateTime, e.end?.date) || startTime(e);
        return [...events].sort((a, b) => {
          const aFuture = endTime(a) >= now;
          const bFuture = endTime(b) >= now;
          if (aFuture !== bFuture) return aFuture ? -1 : 1;
          const diff = startTime(a) - startTime(b);
          return aFuture ? diff : -diff;
        });
      })
    );
  }

  getEventsForRange(timeMin: string, timeMax: string): Observable<CalendarEvent[]> {
    return this.http.get<any>(`${this.apiUrl}/events`, {
      params: { timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime' }
    }).pipe(
      map(response => (Array.isArray(response) ? response : response?.items || []))
    );
  }

  /** Returns true if the server has a valid Google Calendar token, false otherwise. */
  checkConnection(): Observable<boolean> {
    return this.http.get<{ connected: boolean }>(`${this.apiUrl}/status`).pipe(
      map(response => !!response?.connected),
      catchError(() => of(false))
    );
  }

  createEvent(event: Partial<CalendarEvent>): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${this.apiUrl}/events`, event).pipe(
      catchError(error => {
        console.error('Google Calendar event error:', error);
        throw error;
      })
    );
  }

  getAuthUrl(): string {
    const clientId = environment.googleClientId;
    const redirectUri = encodeURIComponent(this.getRedirectUri());
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  }

  /** Redirect back to this app's own origin so OAuth works on any host/port. */
  private getRedirectUri(): string {
    return `${window.location.origin}/calendar/callback`;
  }
}
