import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { StorageService } from './storage.service';

export interface AppSettings {
  workshopName: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  taxRate: number;
  appointmentDuration: number;
  notifyStock: boolean;
  notifyAppointments: boolean;
  notifyInvoices: boolean;
  notifyOrders: boolean;
  notifySync: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  workshopName: '',
  address: '',
  phone: '',
  email: '',
  taxId: '',
  currency: 'USD',
  taxRate: 21,
  appointmentDuration: 60,
  notifyStock: true,
  notifyAppointments: true,
  notifyInvoices: true,
  notifyOrders: true,
  notifySync: true
};

export const CURRENCIES = ['EUR', 'USD', 'UAH', 'RUB', 'GBP', 'PLN', 'MXN'];

/** Workshop-wide settings, stored like any other collection (shared through the server). */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly subject: BehaviorSubject<AppSettings>;
  readonly settings$;

  constructor(private storage: StorageService) {
    this.subject = new BehaviorSubject<AppSettings>(this.read());
    this.settings$ = this.subject.asObservable();
    storage.changes$.pipe(filter(key => key === 'settings')).subscribe(() => this.subject.next(this.read()));
  }

  get value(): AppSettings {
    return this.subject.value;
  }

  save(patch: Partial<AppSettings>): void {
    this.storage.setItem('settings', { ...this.value, ...patch });
  }

  private read(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...(this.storage.getItem<Partial<AppSettings>>('settings') || {}) };
  }
}
