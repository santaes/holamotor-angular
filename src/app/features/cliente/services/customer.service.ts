import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Customer, Vehicle, Communication } from '../models/customer.model';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customers$ = new BehaviorSubject<Customer[]>([]);

  constructor(private storageService: StorageService) {
    this.loadCustomers();
    this.storageService.changes$.subscribe(key => {
      if (['customers'].includes(key)) {
        this.loadCustomers();
      }
    });
  }

  private loadCustomers(): void {
    const customers = this.storageService.getItem<Customer[]>('customers') || [];
    this.customers$.next(customers);
  }

  private saveCustomers(customers: Customer[]): void {
    this.storageService.setItem('customers', customers);
    this.customers$.next(customers);
  }

  getCustomers(): Observable<Customer[]> {
    return this.customers$.asObservable();
  }

  getCustomerById(id: number): Observable<Customer> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === id);
    if (customer) {
      return of(customer);
    }
    throw new Error('Customer not found');
  }

  createCustomer(customer: Customer): Observable<Customer> {
    const customers = this.customers$.value;
    const newId = this.generateId(customers);
    const newCustomer = { ...customer, id: newId };

    // Update vehicle clienteId to match the new customer ID
    if (newCustomer.vehiculos) {
      newCustomer.vehiculos = newCustomer.vehiculos.map(v => ({
        ...v,
        id: v.id || this.generateId(newCustomer.vehiculos || []),
        clienteId: newId
      }));
    }

    customers.push(newCustomer);
    this.saveCustomers(customers);
    return of(newCustomer);
  }

  updateCustomer(id: number, customer: Customer): Observable<Customer> {
    const customers = this.customers$.value;
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customer, id };
      this.saveCustomers(customers);
      return of(customers[index]);
    }
    throw new Error('Customer not found');
  }

  deleteCustomer(id: number): Observable<void> {
    const customers = this.customers$.value.filter(c => c.id !== id);
    this.saveCustomers(customers);
    return of(void 0);
  }

  searchCustomers(query: string): Observable<Customer[]> {
    const customers = this.customers$.value;
    const filtered = customers.filter(c =>
      c.nombre.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase()) ||
      c.telefono.includes(query)
    );
    return of(filtered);
  }

  // Vehicle operations
  getCustomerVehicles(customerId: number): Observable<Vehicle[]> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    return of(customer?.vehiculos || []);
  }

  addVehicle(customerId: number, vehicle: Vehicle): Observable<Vehicle> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newVehicle = { ...vehicle, id: this.generateId(customer.vehiculos || []) };
      if (!customer.vehiculos) customer.vehiculos = [];
      customer.vehiculos.push(newVehicle);
      this.saveCustomers(customers);
      return of(newVehicle);
    }
    throw new Error('Customer not found');
  }

  updateVehicle(vehicleId: number, vehicle: Vehicle): Observable<Vehicle> {
    const customers = this.customers$.value;
    for (const customer of customers) {
      if (customer.vehiculos) {
        const index = customer.vehiculos.findIndex(v => v.id === vehicleId);
        if (index !== -1) {
          customer.vehiculos[index] = { ...vehicle, id: vehicleId };
          this.saveCustomers(customers);
          return of(customer.vehiculos[index]);
        }
      }
    }
    throw new Error('Vehicle not found');
  }

  deleteVehicle(vehicleId: number): Observable<void> {
    const customers = this.customers$.value;
    for (const customer of customers) {
      if (customer.vehiculos) {
        const index = customer.vehiculos.findIndex(v => v.id === vehicleId);
        if (index !== -1) {
          customer.vehiculos.splice(index, 1);
          this.saveCustomers(customers);
          return of(void 0);
        }
      }
    }
    throw new Error('Vehicle not found');
  }

  // Communication operations
  getCommunications(customerId: number): Observable<Communication[]> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    return of(customer?.historialComunicaciones || []);
  }

  addCommunication(customerId: number, communication: Communication): Observable<Communication> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newCommunication = { ...communication, id: this.generateId(customer.historialComunicaciones || []) };
      if (!customer.historialComunicaciones) customer.historialComunicaciones = [];
      customer.historialComunicaciones.push(newCommunication);
      this.saveCustomers(customers);
      return of(newCommunication);
    }
    throw new Error('Customer not found');
  }

  // Loyalty operations
  addLoyaltyPoints(customerId: number, points: number): Observable<Customer> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      customer.lealtadPuntos = (customer.lealtadPuntos || 0) + points;
      this.saveCustomers(customers);
      return of(customer);
    }
    throw new Error('Customer not found');
  }

  private generateId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }
}
