import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { MoneyPipe } from '../../core/pipes/money.pipe';
import { t } from '../../core/i18n/i18n';
import { CustomerService } from '../../features/cliente/services/customer.service';
import { OrderService } from '../../features/orden-reparacion/services/order.service';
import { BillingService } from '../../features/facturacion/services/billing.service';
import { AppointmentService } from '../../features/citas/services/appointment.service';
import { InventoryService } from '../../features/inventario/services/inventory.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
    MoneyPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = {
    totalCustomers: 0,
    activeOrders: 0,
    pendingInvoices: 0,
    todayAppointments: 0,
    revenueThisMonth: 0,
    inventoryValue: 0
  };

  recentActivities: any[] = [];
  topServices: any[] = [];
  upcomingAppointments: any[] = [];

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
    if (h < 12) return t('Buenos días');
    if (h < 20) return t('Buenas tardes');
    return t('Buenas noches');
  }

  constructor(
    private customerService: CustomerService,
    private orderService: OrderService,
    private billingService: BillingService,
    private appointmentService: AppointmentService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    combineLatest([
      this.customerService.getCustomers(),
      this.orderService.getOrders(),
      this.billingService.getInvoices(),
      this.appointmentService.getAppointmentsByDate(this.today),
      this.inventoryService.getInventoryItems()
    ]).subscribe(([customers, orders, invoices, appointments, inventory]) => {
      const ordersArr = Array.isArray(orders) ? orders : [];
      const invoicesArr = Array.isArray(invoices) ? invoices : [];
      const appointmentsArr = Array.isArray(appointments) ? appointments : [];
      const inventoryArr = Array.isArray(inventory) ? inventory : [];

      this.stats.totalCustomers = customers.length;
      this.stats.activeOrders = ordersArr.filter(o => o.estado !== 'Listo' && o.estado !== 'Entregado' && o.estado !== 'Cancelado').length;
      this.stats.pendingInvoices = invoicesArr.filter(i => i.estado === 'Enviada' || i.estado === 'Vencida').length;
      this.stats.todayAppointments = appointmentsArr.length;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      this.stats.revenueThisMonth = invoicesArr
        .filter(i => new Date(i.fechaEmision) >= thisMonth && i.estado === 'Pagada')
        .reduce((sum, i) => sum + (i.total || 0), 0);
      
      this.stats.inventoryValue = inventoryArr.reduce((sum, item) => sum + ((item.precioVenta || 0) * (item.cantidad || 0)), 0);

      this.upcomingAppointments = appointmentsArr.slice(0, 5).map(a => ({
        time: a.horaInicio,
        customer: a.clienteNombre,
        vehicle: a.vehiculoInfo,
        service: a.descripcion || a.tipo
      }));

      this.recentActivities = this.buildRecentActivities(ordersArr, invoicesArr, appointmentsArr, customers);
      this.topServices = this.buildTopServices(ordersArr);
    });
  }

  private buildRecentActivities(orders: any[], invoices: any[], appointments: any[], customers: any[]): any[] {
    const activities: any[] = [];
    const now = new Date();

    orders.slice(-5).forEach(o => {
      activities.push({
        type: 'order',
        icon: 'build',
        message: `Orden #${o.numeroOrden} - ${o.vehiculoInfo}`,
        time: this.formatTimeAgo(new Date(o.fechaIngreso), now),
        color: 'primary'
      });
    });

    invoices.slice(-5).forEach(i => {
      activities.push({
        type: 'invoice',
        icon: 'receipt_long',
        message: `Factura #${i.numeroFactura} - ${i.estado} - ${this.formatMoney(i.total)}`,
        time: this.formatTimeAgo(new Date(i.fechaEmision), now),
        color: i.estado === 'Pagada' ? 'accent' : 'warn'
      });
    });

    appointments.slice(-5).forEach(a => {
      activities.push({
        type: 'appointment',
        icon: 'event',
        message: `Cita: ${a.clienteNombre} - ${a.vehiculoInfo}`,
        time: this.formatTimeAgo(new Date(a.fechaCreacion), now),
        color: 'primary'
      });
    });

    customers.slice(-3).forEach(c => {
      activities.push({
        type: 'customer',
        icon: 'person_add',
        message: `Nuevo cliente: ${c.nombre} ${c.apellido || ''}`,
        time: this.formatTimeAgo(new Date(c.fechaRegistro), now),
        color: 'primary'
      });
    });

    return activities.sort((a, b) => this.parseTimeAgo(b.time) - this.parseTimeAgo(a.time)).slice(0, 5);
  }

  private buildTopServices(orders: any[]): any[] {
    const serviceCounts: Record<string, { count: number; revenue: number }> = {};
    
    orders.forEach(o => {
      const service = o.descripcionProblema || o.trabajoRealizado || 'Servicio general';
      if (!serviceCounts[service]) {
        serviceCounts[service] = { count: 0, revenue: 0 };
      }
      serviceCounts[service].count++;
      serviceCounts[service].revenue += o.costoFinal || o.costoEstimado || 0;
    });

    return Object.entries(serviceCounts)
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private formatTimeAgo(date: Date, now: Date): string {
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} d`;
  }

  private parseTimeAgo(timeStr: string): number {
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private formatMoney(amount: number): string {
    return `${amount.toFixed(2)} €`;
  }

  getRevenueColor(): string {
    const revenue = this.stats.revenueThisMonth;
    if (revenue > 50000) return 'accent';
    if (revenue > 30000) return 'primary';
    return 'warn';
  }
}
