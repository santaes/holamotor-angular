import { Injectable } from '@angular/core';
import { Observable, of, combineLatest, BehaviorSubject, throwError } from 'rxjs';
import { map, switchMap, filter } from 'rxjs/operators';
import { Vehicle, Customer } from '../../cliente/models/customer.model';
import { CustomerService } from '../../cliente/services/customer.service';
import { OrderService } from '../../orden-reparacion/services/order.service';
import { StorageService } from '../../../core/services/storage.service';
import { VehicleWithOwner, VehicleProcedure } from '../models/vehicle.model';

/** Vehicles with no owner live in their own collection; clienteId 0 means unassigned. */
@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private static readonly UNASSIGNED_KEY = 'vehicles';
  private unassigned$ = new BehaviorSubject<Vehicle[]>([]);

  constructor(
    private customerService: CustomerService,
    private orderService: OrderService,
    private storage: StorageService
  ) {
    this.loadUnassigned();
    this.storage.changes$
      .pipe(filter(key => key === VehicleService.UNASSIGNED_KEY))
      .subscribe(() => this.loadUnassigned());
  }

  private loadUnassigned(): void {
    this.unassigned$.next(this.storage.getItem<Vehicle[]>(VehicleService.UNASSIGNED_KEY) || []);
  }

  private saveUnassigned(vehicles: Vehicle[]): void {
    this.storage.setItem(VehicleService.UNASSIGNED_KEY, vehicles);
  }

  private nextId(items: { id?: number }[]): number {
    return items.length ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }

  getAllVehicles(): Observable<VehicleWithOwner[]> {
    return combineLatest([
      this.customerService.getCustomers(),
      this.orderService.getOrders(),
      this.unassigned$
    ]).pipe(
      map(([customers, orders, unassigned]) => {
        const result: VehicleWithOwner[] = [];
        for (const customer of customers) {
          const customerName = `${customer.nombre} ${customer.apellido || ''}`.trim();
          for (const vehicle of customer.vehiculos || []) {
            const orderCount = orders.filter(o =>
              o.clienteId === customer.id && o.vehiculoId === vehicle.id
            ).length;
            result.push({
              ...vehicle,
              clienteId: customer.id!,
              customerName,
              customerEmail: customer.email,
              customerPhone: customer.telefono,
              orderCount
            });
          }
        }
        for (const vehicle of unassigned) {
          result.push({
            ...vehicle,
            clienteId: 0,
            customerName: '',
            orderCount: 0
          });
        }
        return result.sort((a, b) =>
          `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`)
        );
      })
    );
  }

  getVehicleById(customerId: number, vehicleId: number): Observable<VehicleWithOwner> {
    if (!customerId) {
      return this.unassigned$.pipe(
        map(unassigned => {
          const vehicle = unassigned.find(v => v.id === vehicleId);
          if (!vehicle) {
            throw new Error('Vehicle not found');
          }
          return {
            ...vehicle,
            clienteId: 0,
            customerName: '',
            orderCount: 0
          };
        })
      );
    }
    return this.customerService.getCustomers().pipe(
      map(customers => {
        const customer = customers.find(c => c.id === customerId);
        const vehicle = customer?.vehiculos?.find(v => v.id === vehicleId);
        if (!customer || !vehicle) {
          throw new Error('Vehicle not found');
        }
        return {
          ...vehicle,
          clienteId: customerId,
          customerName: `${customer.nombre} ${customer.apellido || ''}`.trim(),
          customerEmail: customer.email,
          customerPhone: customer.telefono
        };
      })
    );
  }

  getVehicleHistory(customerId: number, vehicleId: number): Observable<VehicleProcedure[]> {
    if (!customerId) {
      return of([]);
    }
    return this.orderService.getOrders().pipe(
      map(orders => {
        return orders
          .filter(o => o.clienteId === customerId && o.vehiculoId === vehicleId)
          .sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime())
          .map(order => {
            const parts = (order.partesUsadas || []).map(p => ({
              nombre: p.nombre,
              cantidad: p.cantidad,
              precioUnitario: p.precioUnitario,
              subtotal: p.subtotal
            }));
            const labor = (order.labor || []).map(l => ({
              descripcion: l.descripcion,
              horas: l.horas,
              subtotal: l.subtotal
            }));
            const partsTotal = parts.reduce((s, p) => s + p.subtotal, 0);
            const laborTotal = labor.reduce((s, l) => s + l.subtotal, 0);
            const total = order.costoFinal ?? (order.costoEstimado || partsTotal + laborTotal);
            return { order, parts, labor, total };
          });
      })
    );
  }

  /** customerId null/0 creates the vehicle without an owner. */
  addVehicle(customerId: number | null, vehicle: Vehicle): Observable<Vehicle> {
    if (!customerId) {
      const list = [...this.unassigned$.value];
      const newVehicle = { ...vehicle, id: this.nextId(list), clienteId: 0 };
      list.push(newVehicle);
      this.saveUnassigned(list);
      return of(newVehicle);
    }
    return this.customerService.addVehicle(customerId, vehicle);
  }

  /** customerId 0 updates the unassigned pool; otherwise the customer's vehicle. */
  updateVehicle(customerId: number, vehicleId: number, vehicle: Vehicle): Observable<Vehicle> {
    if (!customerId) {
      const list = this.unassigned$.value;
      const index = list.findIndex(v => v.id === vehicleId);
      if (index === -1) {
        return throwError(() => new Error('Vehicle not found'));
      }
      const updated = { ...vehicle, id: vehicleId, clienteId: 0 };
      const next = [...list];
      next[index] = updated;
      this.saveUnassigned(next);
      return of(updated);
    }
    return this.customerService.updateCustomerVehicle(customerId, vehicleId, vehicle);
  }

  deleteVehicle(customerId: number, vehicleId: number): Observable<void> {
    if (!customerId) {
      this.saveUnassigned(this.unassigned$.value.filter(v => v.id !== vehicleId));
      return of(void 0);
    }
    return this.customerService.deleteCustomerVehicle(customerId, vehicleId);
  }

  /** Moves an unassigned vehicle into a customer's garage; gets a fresh per-customer id. */
  assignVehicle(vehicleId: number, customerId: number, fields?: Partial<Vehicle>): Observable<Vehicle> {
    const vehicle = this.unassigned$.value.find(v => v.id === vehicleId);
    if (!vehicle || !customerId) {
      return throwError(() => new Error('Vehicle not found'));
    }
    const merged = { ...vehicle, ...(fields || {}), clienteId: customerId } as Vehicle;
    let created$: Observable<Vehicle>;
    try {
      created$ = this.customerService.addVehicle(customerId, merged);
    } catch (err) {
      return throwError(() => err);
    }
    return created$.pipe(
      map(created => {
        this.saveUnassigned(this.unassigned$.value.filter(v => v.id !== vehicleId));
        return created;
      })
    );
  }

  /** Moves a customer's vehicle back to the unassigned pool. Only safe when it has no orders. */
  unassignVehicle(customerId: number, vehicleId: number): Observable<Vehicle> {
    return this.customerService.getCustomerVehicles(customerId).pipe(
      switchMap(vehicles => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
          return throwError(() => new Error('Vehicle not found'));
        }
        return this.customerService.deleteCustomerVehicle(customerId, vehicleId).pipe(
          map(() => {
            const list = [...this.unassigned$.value];
            const moved = { ...vehicle, id: this.nextId(list), clienteId: 0 };
            list.push(moved);
            this.saveUnassigned(list);
            return moved;
          })
        );
      })
    );
  }

  getCustomers(): Observable<Customer[]> {
    return this.customerService.getCustomers();
  }
}
