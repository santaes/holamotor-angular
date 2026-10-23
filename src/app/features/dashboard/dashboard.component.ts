import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = {
    totalCustomers: 156,
    activeOrders: 23,
    pendingInvoices: 8,
    todayAppointments: 5,
    revenueThisMonth: 45600,
    inventoryValue: 125000
  };

  recentActivities = [
    { type: 'order', icon: 'build', message: 'Nueva orden #1234 creada - Ford Focus', time: 'Hace 5 min', color: 'primary' },
    { type: 'invoice', icon: 'receipt_long', message: 'Factura #5678 pagada - $2,500', time: 'Hace 15 min', color: 'accent' },
    { type: 'appointment', icon: 'event', message: 'Cita agendada para mañana - 10:00 AM', time: 'Hace 30 min', color: 'warn' },
    { type: 'customer', icon: 'person_add', message: 'Nuevo cliente registrado: María García', time: 'Hace 1 hora', color: 'primary' },
    { type: 'inventory', icon: 'inventory_2', message: 'Stock bajo: Filtros de aceite (5 unidades)', time: 'Hace 2 horas', color: 'warn' }
  ];

  topServices = [
    { name: 'Cambio de Aceite', count: 45, revenue: 11250 },
    { name: 'Frenos', count: 32, revenue: 19200 },
    { name: 'Alineación', count: 28, revenue: 8400 },
    { name: 'Diagnóstico', count: 25, revenue: 7500 },
    { name: 'Batería', count: 18, revenue: 5400 }
  ];

  upcomingAppointments = [
    { time: '09:00', customer: 'Juan Pérez', vehicle: 'Toyota Corolla', service: 'Mantenimiento general' },
    { time: '10:30', customer: 'Ana López', vehicle: 'Honda Civic', service: 'Cambio de frenos' },
    { time: '14:00', customer: 'Carlos Ruiz', vehicle: 'Nissan Sentra', service: 'Diagnóstico motor' },
    { time: '16:00', customer: 'María García', vehicle: 'Chevrolet Spark', service: 'Cambio de aceite' }
  ];

  quickActions = [
    { icon: 'add_task', label: 'Nueva orden', hint: 'Registrar reparación', route: '/ordenes/new', tone: 'blue' },
    { icon: 'person_add', label: 'Nuevo cliente', hint: 'Alta de cliente', route: '/clientes/new', tone: 'green' },
    { icon: 'event_available', label: 'Agendar cita', hint: 'Reservar hueco', route: '/citas/new', tone: 'violet' },
    { icon: 'request_quote', label: 'Nueva factura', hint: 'Emitir factura', route: '/facturacion/new', tone: 'orange' }
  ];

  today = new Date();

  get maxServiceCount(): number {
    return Math.max(...this.topServices.map(s => s.count));
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  constructor() {}

  ngOnInit(): void {
    // Load dashboard data from service
  }

  getRevenueColor(): string {
    const revenue = this.stats.revenueThisMonth;
    if (revenue > 50000) return 'accent';
    if (revenue > 30000) return 'primary';
    return 'warn';
  }
}
