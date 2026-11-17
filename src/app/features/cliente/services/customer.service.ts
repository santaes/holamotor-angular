import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Customer, Vehicle, Communication, Document } from '../models/customer.model';
import { StorageService } from '../../../core/services/storage.service';
import { AppointmentService } from '../../citas/services/appointment.service';
import { OrderService } from '../../orden-reparacion/services/order.service';
import { DiagnosisService } from './diagnosis.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customers$ = new BehaviorSubject<Customer[]>([]);

  constructor(
    private storageService: StorageService,
    private appointmentService: AppointmentService,
    private orderService: OrderService,
    private diagnosisService: DiagnosisService,
    private transactionService: TransactionService
  ) {
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
    // Input validation
    if (!customer.nombre || !customer.apellido || !customer.email || !customer.telefono) {
      return throwError(() => new Error('Nombre, apellido, email y teléfono son requeridos'));
    }
    if (!this.isValidEmail(customer.email)) {
      return throwError(() => new Error('Email inválido'));
    }
    if (!this.isValidPhone(customer.telefono)) {
      return throwError(() => new Error('Teléfono inválido'));
    }

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

  updateCustomer(id: number, customer: Customer, expectedVersion?: number): Observable<Customer> {
    // Input validation
    if (!customer.nombre || !customer.apellido || !customer.email || !customer.telefono) {
      return throwError(() => new Error('Nombre, apellido, email y teléfono son requeridos'));
    }
    if (!this.isValidEmail(customer.email)) {
      return throwError(() => new Error('Email inválido'));
    }
    if (!this.isValidPhone(customer.telefono)) {
      return throwError(() => new Error('Teléfono inválido'));
    }

    const customers = this.customers$.value;
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      const existingCustomer = customers[index];

      // Optimistic locking check
      if (expectedVersion !== undefined && existingCustomer.version !== expectedVersion) {
        return throwError(() => new Error('El cliente ha sido modificado por otro usuario. Por favor, recarga los datos.'));
      }

      // Update with new version
      const updatedCustomer = this.transactionService.addVersion({ ...customer, id });
      customers[index] = updatedCustomer;
      this.saveCustomers(customers);
      return of(updatedCustomer);
    }
    return throwError(() => new Error('Customer not found'));
  }

  deleteCustomer(id: number): Observable<void> {
    // Cascade delete: remove related appointments, orders, and diagnoses
    this.appointmentService.getAppointmentsByCustomer(id).subscribe(appointments => {
      appointments.forEach(a => {
        if (a.id) this.appointmentService.deleteAppointment(a.id).subscribe();
      });
    });

    this.orderService.getOrdersByCustomer(id).subscribe(orders => {
      orders.forEach(o => {
        if (o.id) this.orderService.deleteOrder(o.id).subscribe();
      });
    });

    this.diagnosisService.getDiagnosesByClient(id).subscribe(diagnoses => {
      diagnoses.forEach(d => {
        if (d.id) this.diagnosisService.deleteDiagnosis(d.id).subscribe();
      });
    });

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

  updateCommunication(customerId: number, communicationId: number, communication: Communication): Observable<Communication> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.historialComunicaciones) {
      const index = customer.historialComunicaciones.findIndex(c => c.id === communicationId);
      if (index !== -1) {
        customer.historialComunicaciones[index] = { ...communication, id: communicationId };
        this.saveCustomers(customers);
        return of(customer.historialComunicaciones[index]);
      }
    }
    throw new Error('Communication not found');
  }

  deleteCommunication(customerId: number, communicationId: number): Observable<void> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.historialComunicaciones) {
      const index = customer.historialComunicaciones.findIndex(c => c.id === communicationId);
      if (index !== -1) {
        customer.historialComunicaciones.splice(index, 1);
        this.saveCustomers(customers);
        return of(void 0);
      }
    }
    throw new Error('Communication not found');
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

  // Document operations
  getDocuments(customerId: number): Observable<Document[]> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    return of(customer?.documentos || []);
  }

  addDocument(customerId: number, document: Document): Observable<Document> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newDocument = { ...document, id: this.generateId(customer.documentos || []) };
      if (!customer.documentos) customer.documentos = [];
      customer.documentos.push(newDocument);
      this.saveCustomers(customers);
      return of(newDocument);
    }
    throw new Error('Customer not found');
  }

  deleteDocument(customerId: number, documentId: number): Observable<void> {
    const customers = this.customers$.value;
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.documentos) {
      const index = customer.documentos.findIndex(d => d.id === documentId);
      if (index !== -1) {
        customer.documentos.splice(index, 1);
        this.saveCustomers(customers);
        return of(void 0);
      }
    }
    throw new Error('Document not found');
  }

  private generateId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }
}
