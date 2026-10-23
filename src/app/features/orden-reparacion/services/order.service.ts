import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { RepairOrder } from '../models/order.model';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders$ = new BehaviorSubject<RepairOrder[]>([]);

  constructor(private storageService: StorageService) {
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
    const orders = this.orders$.value;
    const newOrder = { ...order, id: this.generateId(orders) };
    orders.push(newOrder);
    this.saveOrders(orders);
    return of(newOrder);
  }

  updateOrder(id: number, order: RepairOrder): Observable<RepairOrder> {
    const orders = this.orders$.value;
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...order, id };
      this.saveOrders(orders);
      return of(orders[index]);
    }
    throw new Error('Order not found');
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
    return this.updateOrderStatus(id, 'En Progreso');
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
