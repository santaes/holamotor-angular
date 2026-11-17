import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  htmlLink?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private apiUrl = '/api/calendar';

  constructor(private http: HttpClient) {}

  authenticate(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth`, { code }).pipe(
      catchError(error => {
        console.error('Google auth error:', error);
        return of(null);
      })
    );
  }

  getEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.apiUrl}/events`).pipe(
      map(response => response || []),
      catchError(error => {
        console.error('Google Calendar error:', error);
        return of([]);
      })
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
    const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This should come from environment config
    const redirectUri = encodeURIComponent('http://localhost:4200/calendar/callback');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  }
}
