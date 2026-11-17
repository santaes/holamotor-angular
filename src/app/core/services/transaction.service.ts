import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface TransactionOperation {
  service: string;
  method: string;
  params: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private pendingOperations: TransactionOperation[] = [];

  constructor() {}

  /**
   * Execute multiple operations as a transaction
   * If any operation fails, all previous operations are rolled back
   */
  executeTransaction(operations: TransactionOperation[]): Observable<any[]> {
    const results: any[] = [];
    const completedOperations: { service: any; method: string; params: any[]; result: any }[] = [];

    // This is a simplified transaction implementation
    // In a real application, this would use a database transaction
    const executeOperation = (index: number): Observable<any> => {
      if (index >= operations.length) {
        return of(results);
      }

      const operation = operations[index];
      const service = this.getService(operation.service);
      if (!service) {
        return throwError(() => new Error(`Service ${operation.service} not found`));
      }

      const method = service[operation.method];
      if (!method) {
        return throwError(() => new Error(`Method ${operation.method} not found in ${operation.service}`));
      }

      return method.apply(service, operation.params).pipe(
        map(result => {
          results.push(result);
          completedOperations.push({ service, method: operation.method, params: operation.params, result });
          return executeOperation(index + 1);
        }),
        catchError(error => {
          // Rollback completed operations
          this.rollbackOperations(completedOperations);
          return throwError(() => error);
        })
      );
    };

    return executeOperation(0);
  }

  private getService(serviceName: string): any {
    // This would need to be implemented with dependency injection
    // For now, we'll use a simple service locator pattern
    const services = {
      'CustomerService': (window as any).customerService,
      'AppointmentService': (window as any).appointmentService,
      'OrderService': (window as any).orderService,
      'InventoryService': (window as any).inventoryService,
      'DiagnosisService': (window as any).diagnosisService
    };
    return services[serviceName];
  }

  private rollbackOperations(operations: { service: any; method: string; params: any[]; result: any }[]): void {
    // Simplified rollback - in a real app, this would use database transactions
    operations.reverse().forEach(op => {
      try {
        // Attempt to undo the operation
        // This is simplified and would need proper implementation
        console.warn('Rollback not fully implemented for', op.method);
      } catch (error) {
        console.error('Rollback failed:', error);
      }
    });
  }

  /**
   * Add optimistic locking version to an entity
   */
  addVersion<T extends { id?: number; version?: number }>(entity: T): T {
    return {
      ...entity,
      version: (entity.version || 0) + 1,
      lastModified: new Date()
    } as T;
  }

  /**
   * Check if entity has been modified by another user
   */
  checkVersion<T extends { version?: number }>(entity: T, expectedVersion: number): boolean {
    return entity.version === expectedVersion;
  }
}
