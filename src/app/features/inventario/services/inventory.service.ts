import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { InventoryItem, Supplier, PurchaseOrder } from '../models/inventory.model';
import { StorageService } from '../../../core/services/storage.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private items$ = new BehaviorSubject<InventoryItem[]>([]);
  private suppliers$ = new BehaviorSubject<Supplier[]>([]);
  private purchaseOrders$ = new BehaviorSubject<PurchaseOrder[]>([]);

  constructor(
    private storageService: StorageService,
    private transactionService: TransactionService
  ) {
    this.loadData();
    this.storageService.changes$.subscribe(key => {
      if (['inventory', 'purchaseOrders', 'suppliers'].includes(key)) {
        this.loadData();
      }
    });
  }

  private loadData(): void {
    const items = this.storageService.getItem<InventoryItem[]>('inventory') || [];
    this.items$.next(items);
    const suppliers = this.storageService.getItem<Supplier[]>('suppliers') || [];
    this.suppliers$.next(suppliers);
    const purchaseOrders = this.storageService.getItem<PurchaseOrder[]>('purchaseOrders') || [];
    this.purchaseOrders$.next(purchaseOrders);
  }

  private saveItems(items: InventoryItem[]): void {
    this.storageService.setItem('inventory', items);
    this.items$.next(items);
  }

  private saveSuppliers(suppliers: Supplier[]): void {
    this.storageService.setItem('suppliers', suppliers);
    this.suppliers$.next(suppliers);
  }

  private savePurchaseOrders(orders: PurchaseOrder[]): void {
    this.storageService.setItem('purchaseOrders', orders);
    this.purchaseOrders$.next(orders);
  }

  // Inventory Items
  getInventoryItems(): Observable<InventoryItem[]> {
    return this.items$.asObservable();
  }

  getInventoryItemById(id: number): Observable<InventoryItem> {
    const items = this.items$.value;
    const item = items.find(i => i.id === id);
    if (item) {
      return of(item);
    }
    throw new Error('Item not found');
  }

  createInventoryItem(item: InventoryItem): Observable<InventoryItem> {
    // Input validation
    if (!item.nombre || !item.codigo || item.cantidad < 0 || item.precioCompra < 0 || item.precioVenta < 0) {
      return throwError(() => new Error('Nombre, código, cantidad y precios son requeridos y deben ser válidos'));
    }

    const items = this.items$.value;
    const newItem = { ...item, id: this.generateId(items) };
    items.push(newItem);
    this.saveItems(items);
    return of(newItem);
  }

  updateInventoryItem(id: number, item: InventoryItem, expectedVersion?: number): Observable<InventoryItem> {
    // Input validation
    if (!item.nombre || !item.codigo || item.cantidad < 0 || item.precioCompra < 0 || item.precioVenta < 0) {
      return throwError(() => new Error('Nombre, código, cantidad y precios son requeridos y deben ser válidos'));
    }

    const items = this.items$.value;
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      const existingItem = items[index];

      // Optimistic locking check
      if (expectedVersion !== undefined && existingItem.version !== expectedVersion) {
        return throwError(() => new Error('El item ha sido modificado por otro usuario. Por favor, recarga los datos.'));
      }

      // Update with new version
      const updatedItem = this.transactionService.addVersion({ ...item, id });
      items[index] = updatedItem;
      this.saveItems(items);
      return of(updatedItem);
    }
    return throwError(() => new Error('Item not found'));
  }

  deleteInventoryItem(id: number): Observable<void> {
    const items = this.items$.value.filter(i => i.id !== id);
    this.saveItems(items);
    return of(void 0);
  }

  getLowStockItems(): Observable<InventoryItem[]> {
    const items = this.items$.value.filter(i => i.cantidad <= i.cantidadMinima);
    return of(items);
  }

  searchInventoryItems(query: string): Observable<InventoryItem[]> {
    const items = this.items$.value.filter(i =>
      i.nombre.toLowerCase().includes(query.toLowerCase()) ||
      i.codigo.toLowerCase().includes(query.toLowerCase())
    );
    return of(items);
  }

  updateStock(id: number, quantity: number, expectedVersion?: number): Observable<InventoryItem> {
    // Input validation
    if (quantity < 0) {
      return throwError(() => new Error('La cantidad no puede ser negativa'));
    }

    const items = this.items$.value;
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      const existingItem = items[index];

      // Optimistic locking check
      if (expectedVersion !== undefined && existingItem.version !== expectedVersion) {
        return throwError(() => new Error('El item ha sido modificado por otro usuario. Por favor, recarga los datos.'));
      }

      // Update stock with new version
      const updatedItem = this.transactionService.addVersion({
        ...existingItem,
        cantidad: quantity
      });
      items[index] = updatedItem;
      this.saveItems(items);

      return of(updatedItem);
    }
    return throwError(() => new Error('Item not found'));
  }

  // Suppliers
  getSuppliers(): Observable<Supplier[]> {
    return this.suppliers$.asObservable();
  }

  getSupplierById(id: number): Observable<Supplier> {
    const suppliers = this.suppliers$.value;
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      return of(supplier);
    }
    throw new Error('Supplier not found');
  }

  createSupplier(supplier: Supplier): Observable<Supplier> {
    const suppliers = this.suppliers$.value;
    const newSupplier = { ...supplier, id: this.generateId(suppliers) };
    suppliers.push(newSupplier);
    this.saveSuppliers(suppliers);
    return of(newSupplier);
  }

  updateSupplier(id: number, supplier: Supplier): Observable<Supplier> {
    const suppliers = this.suppliers$.value;
    const index = suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      suppliers[index] = { ...supplier, id };
      this.saveSuppliers(suppliers);
      return of(suppliers[index]);
    }
    throw new Error('Supplier not found');
  }

  deleteSupplier(id: number): Observable<void> {
    const suppliers = this.suppliers$.value.filter(s => s.id !== id);
    this.saveSuppliers(suppliers);
    return of(void 0);
  }

  // Purchase Orders
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.purchaseOrders$.asObservable();
  }

  getPurchaseOrderById(id: number): Observable<PurchaseOrder> {
    const orders = this.purchaseOrders$.value;
    const order = orders.find(o => o.id === id);
    if (order) {
      return of(order);
    }
    throw new Error('Purchase order not found');
  }

  createPurchaseOrder(order: PurchaseOrder): Observable<PurchaseOrder> {
    const orders = this.purchaseOrders$.value;
    const newOrder = { ...order, id: this.generateId(orders) };
    orders.push(newOrder);
    this.savePurchaseOrders(orders);
    return of(newOrder);
  }

  updatePurchaseOrder(id: number, order: PurchaseOrder): Observable<PurchaseOrder> {
    const orders = this.purchaseOrders$.value;
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...order, id };
      this.savePurchaseOrders(orders);
      return of(orders[index]);
    }
    throw new Error('Purchase order not found');
  }

  deletePurchaseOrder(id: number): Observable<void> {
    const orders = this.purchaseOrders$.value.filter(o => o.id !== id);
    this.savePurchaseOrders(orders);
    return of(void 0);
  }

  updatePurchaseOrderStatus(id: number, estado: PurchaseOrder['estado']): Observable<PurchaseOrder> {
    const orders = this.purchaseOrders$.value;
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].estado = estado;
      this.savePurchaseOrders(orders);
      return of(orders[index]);
    }
    throw new Error('Purchase order not found');
  }

  receivePurchaseOrder(id: number): Observable<PurchaseOrder> {
    const orders = this.purchaseOrders$.value;
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const order = orders[index];
      // Validate order can be received
      if (order.estado !== 'Pendiente' && order.estado !== 'Enviado') {
        return throwError(() => new Error('La orden de compra debe estar en estado Pendiente o Enviado para ser recibida'));
      }

      // Update order status
      order.estado = 'Recibido';
      order.fechaEntregaReal = new Date();
      this.savePurchaseOrders(orders);

      // Update inventory stock for each item in the order
      if (order.items && order.items.length > 0) {
        order.items.forEach(orderItem => {
          const items = this.items$.value;
          const itemIndex = items.findIndex(i => i.id === orderItem.inventarioId);
          if (itemIndex !== -1) {
            items[itemIndex].cantidad += orderItem.cantidad;
          }
        });
        this.saveItems(this.items$.value);
      }

      return of(order);
    }
    return throwError(() => new Error('Purchase order not found'));
  }

  private generateId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }
}
