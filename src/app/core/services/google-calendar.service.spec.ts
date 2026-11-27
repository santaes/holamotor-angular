import { GoogleCalendarService, CalendarEvent } from './google-calendar.service';
import { of, throwError, firstValueFrom } from 'rxjs';

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let mockHttp: any;

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn()
    };
    service = new GoogleCalendarService(mockHttp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a valid Google OAuth authorization URL', () => {
    const url = service.getAuthUrl();
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar');
    expect(url).toContain('response_type=code');
    expect(url).toContain('access_type=offline');
  });

  it('should authenticate code via POST /api/calendar/auth', async () => {
    mockHttp.post.mockReturnValue(of({ success: true }));

    const res = await firstValueFrom(service.authenticate('test-auth-code'));
    expect(mockHttp.post).toHaveBeenCalledWith('/api/calendar/auth', {
      code: 'test-auth-code',
      redirectUri: `${window.location.origin}/calendar/callback`
    });
    expect(res).toEqual({ success: true });
  });

  it('should return null when authentication fails', async () => {
    mockHttp.post.mockReturnValue(throwError(() => new Error('Auth failed')));

    const res = await firstValueFrom(service.authenticate('bad-code'));
    expect(res).toBeNull();
  });

  it('should handle getEvents when backend returns a direct array', async () => {
    const rawEvents: CalendarEvent[] = [
      {
        id: '1',
        summary: 'Cita Taller',
        start: { dateTime: '2026-11-20T10:00:00Z', timeZone: 'Europe/Madrid' },
        end: { dateTime: '2026-11-20T11:00:00Z', timeZone: 'Europe/Madrid' }
      }
    ];
    mockHttp.get.mockReturnValue(of(rawEvents));

    const events = await firstValueFrom(service.getEvents());
    expect(events.length).toBe(1);
    expect(events[0].summary).toBe('Cita Taller');
  });

  it('should defensively unwrap items when backend returns an object with items', async () => {
    const wrappedResponse = {
      kind: 'calendar#events',
      items: [
        {
          id: '2',
          summary: 'Revisión Frenos',
          start: { dateTime: '2026-11-21T12:00:00Z', timeZone: 'Europe/Madrid' },
          end: { dateTime: '2026-11-21T13:00:00Z', timeZone: 'Europe/Madrid' }
        }
      ]
    };
    mockHttp.get.mockReturnValue(of(wrappedResponse));

    const events = await firstValueFrom(service.getEvents());
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(1);
    expect(events[0].summary).toBe('Revisión Frenos');
  });

  it('should post new event via /api/calendar/events', async () => {
    const newEvent: Partial<CalendarEvent> = {
      summary: 'Cambio Batería',
      start: { dateTime: '2026-11-22T09:00:00Z', timeZone: 'Europe/Madrid' },
      end: { dateTime: '2026-11-22T10:00:00Z', timeZone: 'Europe/Madrid' }
    };
    mockHttp.post.mockReturnValue(of({ ...newEvent, id: 'event-123' }));

    const created = await firstValueFrom(service.createEvent(newEvent));
    expect(mockHttp.post).toHaveBeenCalledWith('/api/calendar/events', newEvent);
    expect(created.id).toBe('event-123');
  });

  it('checkConnection should return true when /api/calendar/status reports connected', async () => {
    mockHttp.get.mockReturnValue(of({ connected: true }));
    const connected = await firstValueFrom(service.checkConnection());
    expect(connected).toBe(true);
    expect(mockHttp.get).toHaveBeenCalledWith('/api/calendar/status');
  });

  it('checkConnection should return false when /api/calendar/events returns 401', async () => {
    const { throwError } = await import('rxjs');
    mockHttp.get.mockReturnValue(throwError(() => ({ status: 401 })));
    const connected = await firstValueFrom(service.checkConnection());
    expect(connected).toBe(false);
  });
});
