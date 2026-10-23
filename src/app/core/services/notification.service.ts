import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, merge, interval } from 'rxjs';
import { StorageService } from './storage.service';
import { SettingsService } from './settings.service';
import { currentLocale, t } from '../i18n/i18n';

export interface AppNotification {
  id: string;
  icon: string;
  tone: string;
  title: string;
  detail: string;
  route: string;
  read: boolean;
}

const READ_KEY = 'holamotor_notifications_read';
const SECTION_LABELS: Record<string, [string, string]> = {
  customers: ['Clientes', '/clientes'],
  orders: ['Órdenes de Reparación', '/ordenes'],
  inventory: ['Inventario', '/inventario'],
  invoices: ['Facturación', '/facturacion'],
  appointments: ['Citas', '/citas'],
  settings: ['Configuración', '/configuracion']
};

/** Builds alerts from the workshop data (stock, appointments, invoices, orders) plus live-sync events. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly subject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.subject.asObservable();
  private readIds = new Set<string>(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  private syncEvents: AppNotification[] = [];

  constructor(private storage: StorageService, private settings: SettingsService, zone: NgZone) {
    storage.remoteChanges$.subscribe(key => this.addSyncEvent(key));
    merge(storage.changes$, settings.settings$).subscribe(() => this.refresh());
    zone.runOutsideAngular(() => interval(60_000).subscribe(() => zone.run(() => this.refresh())));
  }

  get unreadCount(): number {
    return this.subject.value.filter(n => !n.read).length;
  }

  markRead(id: string): void {
    this.readIds.add(id);
    this.persist();
  }

  markAllRead(): void {
    this.subject.value.forEach(n => this.readIds.add(n.id));
    this.persist();
  }

  private persist(): void {
    const activeIds = new Set(this.subject.value.map(n => n.id));
    this.readIds = new Set([...this.readIds].filter(id => activeIds.has(id)));
    localStorage.setItem(READ_KEY, JSON.stringify([...this.readIds]));
    this.refresh();
  }

  private addSyncEvent(key: string): void {
    const section = SECTION_LABELS[key];
    if (!section || !this.settings.value.notifySync) {
      return;
    }
    this.syncEvents = [
      {
        id: `sync-${key}-${Date.now()}`,
        icon: 'sync',
        tone: 'blue',
        title: 'Datos actualizados desde otro dispositivo',
        detail: `${t(section[0])} · ${new Date().toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' })}`,
        route: section[1],
        read: false
      },
      ...this.syncEvents
    ].slice(0, 10);
    this.refresh();
  }

  private refresh(): void {
    const s = this.settings.value;
    const list: Omit<AppNotification, 'read'>[] = [...this.syncEvents];
    const today = new Date().toDateString();
    const money = new Intl.NumberFormat(currentLocale, { style: 'currency', currency: s.currency || 'USD' });

    if (s.notifyStock) {
      for (const item of this.storage.getItem<any[]>('inventory') || []) {
        if (item.estado !== 'Inactivo' && Number(item.cantidad) <= Number(item.cantidadMinima)) {
          list.push({
            id: `stock-${item.id}-${item.cantidad}`,
            icon: 'inventory_2',
            tone: 'red',
            title: 'Stock bajo',
            detail: `${item.nombre}: ${item.cantidad} (${t('mín.')} ${item.cantidadMinima})`,
            route: `/inventario/${item.id}`
          });
        }
      }
    }

    if (s.notifyAppointments) {
      for (const a of this.storage.getItem<any[]>('appointments') || []) {
        if (new Date(a.fecha).toDateString() === today && !['Cancelada', 'Completada', 'No Asistió'].includes(a.estado)) {
          list.push({
            id: `appt-${a.id}-${today}`,
            icon: 'event',
            tone: 'violet',
            title: 'Cita hoy',
            detail: `${a.horaInicio || ''} · ${a.clienteNombre || ''} · ${t(a.tipo)}`,
            route: `/citas/${a.id}`
          });
        }
      }
    }

    if (s.notifyInvoices) {
      for (const inv of this.storage.getItem<any[]>('invoices') || []) {
        const overdue = inv.estado === 'Vencida' ||
          (!['Pagada', 'Cancelada', 'Borrador'].includes(inv.estado) && inv.fechaVencimiento && new Date(inv.fechaVencimiento) < new Date());
        if (overdue) {
          list.push({
            id: `invoice-${inv.id}-overdue`,
            icon: 'receipt_long',
            tone: 'orange',
            title: 'Factura vencida',
            detail: `${inv.numeroFactura || ''} · ${inv.clienteNombre || ''} · ${money.format(Number(inv.total) || 0)}`,
            route: `/facturacion/${inv.id}`
          });
        }
      }
    }

    if (s.notifyOrders) {
      for (const o of this.storage.getItem<any[]>('orders') || []) {
        if (o.estado === 'Listo') {
          list.push({
            id: `order-${o.id}-ready`,
            icon: 'task_alt',
            tone: 'green',
            title: 'Orden lista para entregar',
            detail: `${o.numeroOrden || ''} · ${o.clienteNombre || ''} · ${o.vehiculoInfo || ''}`,
            route: `/ordenes/${o.id}`
          });
        }
      }
    }

    this.subject.next(list.map(n => ({ ...n, read: this.readIds.has(n.id) })));
  }
}
