import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { currentLang } from '../i18n/i18n';

/**
 * Key/value store for all app data.
 * When the HolaMotor server is reachable, data lives on the server (shared by every device);
 * otherwise it falls back to the browser's localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly prefix = 'holamotor_';
  private readonly api = 'api/data';
  private cache: Record<string, unknown> = {};
  private serverMode = false;
  private readonly clientId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  /** Per-device keys that must never be uploaded or exported. */
  private readonly deviceKeys = ['lang', 'notifications_read'];

  /** Emits the key of every collection that changed (local or remote). */
  readonly changes$ = new Subject<string>();
  /** Emits only for changes made on another device. */
  readonly remoteChanges$ = new Subject<string>();

  constructor(private zone: NgZone) {}

  get isServerMode(): boolean {
    return this.serverMode;
  }

  /** Called once at startup (APP_INITIALIZER) before any feature service reads data. */
  async load(): Promise<void> {
    try {
      const res = await fetch(this.api, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      this.cache = await res.json();
      this.serverMode = true;
      this.migrateLocalData();
      this.listenForChanges();
    } catch {
      this.serverMode = false;
      console.warn('HolaMotor server not reachable, using browser storage.');
    }
    this.initializeData();
  }

  /** First run against an empty server: upload any data this browser already had. */
  private migrateLocalData(): void {
    if (Object.keys(this.cache).length > 0) {
      return;
    }
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix) && !this.deviceKeys.includes(key.slice(this.prefix.length)))
      .forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          this.setItem(key.slice(this.prefix.length), JSON.parse(value));
        }
      });
  }

  private initializeData(): void {
    const samples: Record<string, () => unknown[]> = {
      customers: () => this.getSampleCustomers(),
      orders: () => this.getSampleOrders(),
      inventory: () => this.getSampleInventory(),
      invoices: () => this.getSampleInvoices(),
      appointments: () => this.getSampleAppointments()
    };
    Object.entries(samples).forEach(([key, sample]) => {
      if (!this.getItem(key)) {
        this.setItem(key, sample());
      }
    });
  }

  getItem<T>(key: string): T | null {
    if (this.serverMode) {
      const value = this.cache[key];
      return value === undefined ? null : (JSON.parse(JSON.stringify(value)) as T);
    }
    const item = localStorage.getItem(this.prefix + key);
    return item ? JSON.parse(item) : null;
  }

  setItem<T>(key: string, value: T): void {
    if (this.serverMode) {
      this.cache[key] = JSON.parse(JSON.stringify(value));
      this.send('PUT', key, value);
    } else {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }
    this.changes$.next(key);
  }

  removeItem(key: string): void {
    if (this.serverMode) {
      delete this.cache[key];
      this.send('DELETE', key);
    } else {
      localStorage.removeItem(this.prefix + key);
    }
    this.changes$.next(key);
  }

  clear(): void {
    if (this.serverMode) {
      Object.keys(this.cache).forEach(key => this.removeItem(key));
      return;
    }
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  /** All collections, for backups. */
  exportAll(): Record<string, unknown> {
    if (this.serverMode) {
      return JSON.parse(JSON.stringify(this.cache));
    }
    const out: Record<string, unknown> = {};
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix) && !this.deviceKeys.includes(key.slice(this.prefix.length)))
      .forEach(key => (out[key.slice(this.prefix.length)] = JSON.parse(localStorage.getItem(key) || 'null')));
    return out;
  }

  importAll(data: Record<string, unknown>): void {
    Object.entries(data)
      .filter(([key]) => /^[a-zA-Z0-9_-]{1,64}$/.test(key) && !this.deviceKeys.includes(key))
      .forEach(([key, value]) => this.setItem(key, value));
  }

  /** Replaces the business data with the demo data (settings are kept). */
  resetDemo(): void {
    ['customers', 'orders', 'inventory', 'invoices', 'appointments'].forEach(key => this.removeItem(key));
    this.initializeData();
  }

  /** Live updates: the server pushes the key of every collection saved by any device. */
  private listenForChanges(): void {
    if (typeof EventSource === 'undefined') {
      return;
    }
    let connectedBefore = false;
    const events = new EventSource('api/events');
    events.onopen = () => {
      if (connectedBefore) {
        this.resync();
      }
      connectedBefore = true;
    };
    events.onmessage = msg => {
      try {
        this.applyRemoteChange(JSON.parse(msg.data));
      } catch {
        // ignore malformed events
      }
    };
  }

  private async applyRemoteChange(event: { key?: string; origin?: string; deleted?: boolean }): Promise<void> {
    if (!event?.key || event.origin === this.clientId) {
      return;
    }
    if (event.deleted) {
      delete this.cache[event.key];
    } else {
      try {
        const res = await fetch(`${this.api}/${encodeURIComponent(event.key)}`, { cache: 'no-store' });
        if (!res.ok) {
          return;
        }
        this.cache[event.key] = await res.json();
      } catch {
        return;
      }
    }
    this.emitRemote(event.key);
  }

  /** Remote events arrive outside Angular's zone; re-enter it so views refresh. */
  private emitRemote(key: string): void {
    this.zone.run(() => {
      this.changes$.next(key);
      this.remoteChanges$.next(key);
    });
  }

  /** After a reconnection (e.g. server restart) pick up anything missed while offline. */
  private async resync(): Promise<void> {
    try {
      const res = await fetch(this.api, { cache: 'no-store' });
      if (!res.ok) {
        return;
      }
      const data: Record<string, unknown> = await res.json();
      for (const key of Object.keys(data)) {
        if (JSON.stringify(data[key]) !== JSON.stringify(this.cache[key])) {
          this.cache[key] = data[key];
          this.emitRemote(key);
        }
      }
    } catch {
      // still offline; EventSource keeps retrying
    }
  }

  private send(method: 'PUT' | 'DELETE', key: string, value?: unknown): void {
    fetch(`${this.api}/${encodeURIComponent(key)}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': this.clientId, 'X-Lang': currentLang },
      body: value === undefined ? undefined : JSON.stringify(value),
      keepalive: true
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
      })
      .catch(err => console.error(`Could not save "${key}" to the server:`, err));
  }

  private getSampleCustomers(): any[] {
    return [
      {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@email.com',
        telefono: '555-0101',
        direccion: 'Calle Principal 123',
        ciudad: 'Madrid',
        codigoPostal: '28001',
        nivelLealtad: 'Oro',
        lealtadPuntos: 1250,
        estado: 'Activo',
        fechaRegistro: new Date('2024-01-15'),
        vehiculos: [
          { id: 1, marca: 'Toyota', modelo: 'Corolla', anio: 2020, placa: 'ABC-1234', vin: 'JT1234567890', color: 'Azul', kilometraje: 50000, clienteId: 1 }
        ]
      },
      {
        id: 2,
        nombre: 'María',
        apellido: 'García',
        email: 'maria.garcia@email.com',
        telefono: '555-0102',
        direccion: 'Avenida Central 456',
        ciudad: 'Barcelona',
        codigoPostal: '08001',
        nivelLealtad: 'Plata',
        lealtadPuntos: 850,
        estado: 'Activo',
        fechaRegistro: new Date('2024-02-20'),
        vehiculos: [
          { id: 2, marca: 'Honda', modelo: 'Civic', anio: 2019, placa: 'DEF-5678', vin: 'JM2345678901', color: 'Rojo', kilometraje: 60000, clienteId: 2 }
        ]
      },
      {
        id: 3,
        nombre: 'Carlos',
        apellido: 'Ruiz',
        email: 'carlos.ruiz@email.com',
        telefono: '555-0103',
        direccion: 'Plaza Mayor 789',
        ciudad: 'Valencia',
        codigoPostal: '46001',
        nivelLealtad: 'Bronce',
        lealtadPuntos: 320,
        estado: 'Activo',
        fechaRegistro: new Date('2024-03-10'),
        vehiculos: [
          { id: 3, marca: 'Nissan', modelo: 'Sentra', anio: 2021, placa: 'GHI-9012', vin: 'JN3456789012', color: 'Negro', kilometraje: 30000, clienteId: 3 }
        ]
      }
    ];
  }

  private getSampleOrders(): any[] {
    return [
      {
        id: 1,
        numeroOrden: 'ORD-2024-001',
        clienteId: 1,
        clienteNombre: 'Juan Pérez',
        vehiculoId: 1,
        vehiculoInfo: 'Toyota Corolla 2020',
        fechaIngreso: new Date('2024-10-20'),
        fechaEstimadaSalida: new Date('2024-10-22'),
        estado: 'En Progreso',
        prioridad: 'Media',
        descripcionProblema: 'Cambio de aceite y filtro',
        mecanicoAsignado: 1,
        mecanicoNombre: 'Mecánico Principal',
        costoEstimado: 150,
        aprobadoPorCliente: true
      },
      {
        id: 2,
        numeroOrden: 'ORD-2024-002',
        clienteId: 2,
        clienteNombre: 'María García',
        vehiculoId: 2,
        vehiculoInfo: 'Honda Civic 2019',
        fechaIngreso: new Date('2024-10-21'),
        fechaEstimadaSalida: new Date('2024-10-23'),
        estado: 'Pendiente',
        prioridad: 'Alta',
        descripcionProblema: 'Cambio de frenos',
        mecanicoAsignado: 2,
        mecanicoNombre: 'Mecánico Junior',
        costoEstimado: 350,
        aprobadoPorCliente: false
      },
      {
        id: 3,
        numeroOrden: 'ORD-2024-003',
        clienteId: 3,
        clienteNombre: 'Carlos Ruiz',
        vehiculoId: 3,
        vehiculoInfo: 'Nissan Sentra 2021',
        fechaIngreso: new Date('2024-10-22'),
        fechaEstimadaSalida: new Date('2024-10-24'),
        estado: 'Listo',
        prioridad: 'Baja',
        descripcionProblema: 'Diagnóstico general',
        mecanicoAsignado: 1,
        mecanicoNombre: 'Mecánico Principal',
        costoEstimado: 100,
        costoFinal: 95,
        aprobadoPorCliente: true
      }
    ];
  }

  private getSampleInventory(): any[] {
    return [
      {
        id: 1,
        codigo: 'FIL-001',
        nombre: 'Filtro de Aceite',
        categoria: 'Filtros',
        cantidad: 25,
        cantidadMinima: 10,
        cantidadMaxima: 50,
        precioCompra: 15,
        precioVenta: 25,
        proveedor: 'AutoParts S.L.',
        ubicacion: 'Estantería A1',
        estado: 'Activo'
      },
      {
        id: 2,
        codigo: 'FIL-002',
        nombre: 'Filtro de Aire',
        categoria: 'Filtros',
        cantidad: 18,
        cantidadMinima: 10,
        cantidadMaxima: 40,
        precioCompra: 12,
        precioVenta: 20,
        proveedor: 'AutoParts S.L.',
        ubicacion: 'Estantería A2',
        estado: 'Activo'
      },
      {
        id: 3,
        codigo: 'ACE-001',
        nombre: 'Aceite Sintético 5W-30',
        categoria: 'Lubricantes',
        cantidad: 40,
        cantidadMinima: 15,
        cantidadMaxima: 60,
        precioCompra: 8,
        precioVenta: 15,
        proveedor: 'LubriMax',
        ubicación: 'Estantería B1',
        estado: 'Activo'
      },
      {
        id: 4,
        codigo: 'FRE-001',
        nombre: 'Pastillas de Freno Delanteras',
        categoria: 'Frenos',
        cantidad: 12,
        cantidadMinima: 8,
        cantidadMaxima: 30,
        precioCompra: 45,
        precioVenta: 80,
        proveedor: 'BrakeMaster',
        ubicacion: 'Estantería C1',
        estado: 'Activo'
      },
      {
        id: 5,
        codigo: 'BAT-001',
        nombre: 'Batería 12V',
        categoria: 'Eléctrico',
        cantidad: 8,
        cantidadMinima: 5,
        cantidadMaxima: 20,
        precioCompra: 60,
        precioVenta: 120,
        proveedor: 'PowerBattery',
        ubicacion: 'Estantería D1',
        estado: 'Activo'
      }
    ];
  }

  private getSampleInvoices(): any[] {
    return [
      {
        id: 1,
        numeroFactura: 'FAC-2024-001',
        clienteId: 1,
        clienteNombre: 'Juan Pérez',
        ordenId: 1,
        fechaEmision: '2024-10-20',
        fechaVencimiento: '2024-11-20',
        estado: 'Pagada',
        subtotal: 150,
        impuestos: 31.5,
        total: 181.5,
        pagado: 181.5,
        pendiente: 0,
        items: [
          { descripcion: 'Cambio de aceite', cantidad: 1, precioUnitario: 150, total: 150 }
        ]
      },
      {
        id: 2,
        numeroFactura: 'FAC-2024-002',
        clienteId: 2,
        clienteNombre: 'María García',
        ordenId: null,
        fechaEmision: '2024-10-15',
        fechaVencimiento: '2024-11-15',
        estado: 'Pendiente',
        subtotal: 350,
        impuestos: 73.5,
        total: 423.5,
        pagado: 0,
        pendiente: 423.5,
        items: [
          { descripcion: 'Cambio de frenos', cantidad: 1, precioUnitario: 350, total: 350 }
        ]
      }
    ];
  }

  private getSampleAppointments(): any[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        id: 1,
        clienteId: 1,
        clienteNombre: 'Juan Pérez',
        vehiculoId: 1,
        vehiculoInfo: 'Toyota Corolla 2020',
        fecha: today,
        horaInicio: '09:00',
        horaFin: '10:00',
        duracionMinutos: 60,
        tipo: 'Mantenimiento',
        descripcion: 'Cambio de aceite',
        mecanicoId: 1,
        mecanicoNombre: 'Mecánico Principal',
        estado: 'Confirmada',
        prioridad: 'Media',
        recordatorioEnviado: false,
        notas: 'Cliente preferente',
        fechaCreacion: today
      },
      {
        id: 2,
        clienteId: 2,
        clienteNombre: 'María García',
        vehiculoId: 2,
        vehiculoInfo: 'Honda Civic 2019',
        fecha: tomorrow,
        horaInicio: '10:30',
        horaFin: '12:00',
        duracionMinutos: 90,
        tipo: 'Reparación',
        descripcion: 'Cambio de frenos',
        mecanicoId: 2,
        mecanicoNombre: 'Mecánico Junior',
        estado: 'Programada',
        prioridad: 'Alta',
        recordatorioEnviado: false,
        notas: 'Cliente solicita presupuesto previo',
        fechaCreacion: today
      },
      {
        id: 3,
        clienteId: 3,
        clienteNombre: 'Carlos Ruiz',
        vehiculoId: 3,
        vehiculoInfo: 'Nissan Sentra 2021',
        fecha: tomorrow,
        horaInicio: '14:00',
        horaFin: '15:00',
        duracionMinutos: 60,
        tipo: 'Diagnóstico',
        descripcion: 'Revisión general',
        mecanicoId: 1,
        mecanicoNombre: 'Mecánico Principal',
        estado: 'Programada',
        prioridad: 'Baja',
        recordatorioEnviado: false,
        notas: '',
        fechaCreacion: today
      }
    ];
  }
}
