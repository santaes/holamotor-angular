import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Vehicle, Customer } from '../../cliente/models/customer.model';
import { RepairOrder } from '../../orden-reparacion/models/order.model';
import { CustomerService } from '../../cliente/services/customer.service';
import { OrderService } from '../../orden-reparacion/services/order.service';
import { VehicleWithOwner, VehicleProcedure } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  constructor(
    private customerService: CustomerService,
    private orderService: OrderService
  ) {}

  getAllVehicles(): Observable<VehicleWithOwner[]> {
    return combineLatest([
      this.customerService.getCustomers(),
      this.orderService.getOrders()
    ]).pipe(
      map(([customers, orders]) => {
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
        return result.sort((a, b) =>
          `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`)
        );
      })
    );
  }

  getVehicleById(customerId: number, vehicleId: number): Observable<VehicleWithOwner> {
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

  addVehicle(customerId: number, vehicle: Vehicle): Observable<Vehicle> {
    return this.customerService.addVehicle(customerId, vehicle);
  }

  updateVehicle(customerId: number, vehicleId: number, vehicle: Vehicle): Observable<Vehicle> {
    return this.customerService.updateCustomerVehicle(customerId, vehicleId, vehicle);
  }

  deleteVehicle(customerId: number, vehicleId: number): Observable<void> {
    return this.customerService.deleteCustomerVehicle(customerId, vehicleId);
  }

  getCustomers(): Observable<Customer[]> {
    return this.customerService.getCustomers();
  }
}
