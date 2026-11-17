import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { RepairOrder } from '../models/order.model';
import { StorageService } from '../../../core/services/storage.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders$ = new BehaviorSubject<RepairOrder[]>([]);

  constructor(
    private storageService: StorageService,
    private transactionService: TransactionService
  ) {
    this.loadOrders();
    this.storageService.changes$.subscribe(key => {
      if (['orders'].includes(key)) {
        this.loadOrders();
      }
    });
  }

  private loadOrders(): void {
    const orders = this.storageService.getItem<RepairOrder[]>('orders') || [];
    this.orders$.next(orders);
  }

  private saveOrders(orders: RepairOrder[]): void {
    this.storageService.setItem('orders', orders);
    this.orders$.next(orders);
  }

  getOrders(): Observable<RepairOrder[]> {
    return this.orders$.asObservable();
  }

  getOrderById(id: number): Observable<RepairOrder> {
    const orders = this.orders$.value;
    const order = orders.find(o => o.id === id);
    if (order) {
      return of(order);
    }
    throw new Error('Order not found');
  }

  createOrder(order: RepairOrder): Observable<RepairOrder> {
    // Input validation
    if (!order.clienteId || !order.vehiculoId || !order.descripcionProblema) {
      return throwError(() => new Error('Cliente, vehículo y descripción del problema son requeridos'));
    }

    const orders = this.orders$.value;
    const newOrder = { ...order, id: this.generateId(orders) };
    orders.push(newOrder);
    this.saveOrders(orders);
    return of(newOrder);
  }

  updateOrder(id: number, order: RepairOrder, expectedVersion?: number): Observable<RepairOrder> {
    // Input validation
    if (!order.clienteId || !order.vehiculoId || !order.descripcionProblema) {
      return throwError(() => new Error('Cliente, vehículo y descripción del problema son requeridos'));
    }

    const orders = this.orders$.value;
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const existingOrder = orders[index];

      // Optimistic locking check
      if (expectedVersion !== undefined && existingOrder.version !== expectedVersion) {
        return throwError(() => new Error('La orden ha sido modificada por otro usuario. Por favor, recarga los datos.'));
      }

      // Update with new version
      const updatedOrder = this.transactionService.addVersion({ ...order, id });
      orders[index] = updatedOrder;
      this.saveOrders(orders);
      return of(updatedOrder);
    }
    return throwError(() => new Error('Order not found'));
  }

  deleteOrder(id: number): Observable<void> {
    const orders = this.orders$.value.filter(o => o.id !== id);
    this.saveOrders(orders);
    return of(void 0);
  }

  updateOrderStatus(id: number, estado: RepairOrder['estado']): Observable<RepairOrder> {
    const orders = this.orders$.value;
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].estado = estado;
      this.saveOrders(orders);
      return of(orders[index]);
    }
    throw new Error('Order not found');
  }

  approveOrder(id: number): Observable<RepairOrder> {
    const orders = this.orders$.value;
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const order = orders[index];
      // Validate order can be approved
      if (order.estado !== 'Pendiente' && order.estado !== 'En Progreso') {
        return throwError(() => new Error('La orden debe estar en estado Pendiente o En Progreso para ser aprobada'));
      }

      // Set approval status and update order status
      order.aprobadoPorCliente = true;
      order.aprobadoPorClienteFecha = new Date();
      order.estado = 'En Progreso';
      this.saveOrders(orders);

      return of(order);
    }
    return throwError(() => new Error('Order not found'));
  }

  getOrdersByStatus(status: string): Observable<RepairOrder[]> {
    const orders = this.orders$.value.filter(o => o.estado === status);
    return of(orders);
  }

  getOrdersByMechanic(mechanicId: number): Observable<RepairOrder[]> {
    const orders = this.orders$.value.filter(o => o.mecanicoAsignado === mechanicId);
    return of(orders);
  }

  getOrdersByCustomer(customerId: number): Observable<RepairOrder[]> {
    const orders = this.orders$.value.filter(o => o.clienteId === customerId);
    return of(orders);
  }

  private generateId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }
}
