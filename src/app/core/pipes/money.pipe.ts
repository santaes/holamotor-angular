import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { SettingsService } from '../services/settings.service';

/** Formats an amount in the workshop currency chosen in Configuración. */
@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly formatters = new Map<string, Intl.NumberFormat>();

  constructor(private settings: SettingsService, @Inject(LOCALE_ID) private locale: string) {}

  transform(value: number | string | null | undefined, digits = 2): string {
    const currency = this.settings.value.currency || 'EUR';
    const key = `${currency}-${digits}`;
    let formatter = this.formatters.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      });
      this.formatters.set(key, formatter);
    }
    return formatter.format(Number(value) || 0);
  }
}
