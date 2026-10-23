import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../core/services/storage.service';
import { CURRENCIES, SettingsService } from '../../core/services/settings.service';
import { LANGUAGES, Lang, currentLang, setLang, t } from '../../core/i18n/i18n';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  form: FormGroup;
  currencies = CURRENCIES;
  languages = LANGUAGES;
  language: Lang = currentLang;
  serverMode = false;
  serverUptime: number | null = null;

  constructor(
    private fb: FormBuilder,
    private settings: SettingsService,
    private storage: StorageService,
    private snackBar: MatSnackBar
  ) {
    const s = settings.value;
    this.form = this.fb.group({
      workshopName: [s.workshopName],
      address: [s.address],
      phone: [s.phone],
      email: [s.email, Validators.email],
      taxId: [s.taxId],
      currency: [s.currency, Validators.required],
      taxRate: [s.taxRate, [Validators.required, Validators.min(0), Validators.max(100)]],
      appointmentDuration: [s.appointmentDuration, [Validators.required, Validators.min(15)]],
      notifyStock: [s.notifyStock],
      notifyAppointments: [s.notifyAppointments],
      notifyInvoices: [s.notifyInvoices],
      notifyOrders: [s.notifyOrders],
      notifySync: [s.notifySync]
    });
  }

  ngOnInit(): void {
    this.serverMode = this.storage.isServerMode;
    if (this.serverMode) {
      fetch('api/health', { cache: 'no-store' })
        .then(res => res.json())
        .then(body => (this.serverUptime = body.uptime))
        .catch(() => (this.serverUptime = null));
    }
  }

  get uptimeLabel(): string {
    const s = this.serverUptime ?? 0;
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.settings.save(this.form.value);
    this.form.markAsPristine();
    this.snackBar.open(t('Configuración guardada'), t('Cerrar'), { duration: 3000 });
  }

  changeLanguage(lang: Lang): void {
    if (this.form.dirty && this.form.valid) {
      this.settings.save(this.form.value);
    }
    setLang(lang);
  }

  exportBackup(): void {
    const backup = { app: 'holamotor', version: 1, exportedAt: new Date().toISOString(), data: this.storage.exportAll() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `holamotor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed?.app === 'holamotor' ? parsed.data : parsed;
      if (!data || typeof data !== 'object' || Array.isArray(data) || !Object.keys(data).length) {
        throw new Error('invalid');
      }
      if (!confirm(t('¿Importar esta copia? Se reemplazarán los datos actuales.'))) {
        return;
      }
      this.storage.importAll(data);
      this.snackBar.open(t('Copia importada correctamente'), t('Cerrar'), { duration: 3000 });
    } catch {
      this.snackBar.open(t('Archivo de copia no válido'), t('Cerrar'), { duration: 4000 });
    }
  }

  resetDemo(): void {
    if (confirm(t('¿Restablecer los datos de ejemplo? Se borrarán clientes, órdenes, inventario, facturas y citas.'))) {
      this.storage.resetDemo();
      this.snackBar.open(t('Datos de ejemplo restablecidos'), t('Cerrar'), { duration: 3000 });
    }
  }
}
