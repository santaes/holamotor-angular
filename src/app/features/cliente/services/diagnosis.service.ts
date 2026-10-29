import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { CarDiagnosis } from '../models/diagnosis.model';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class DiagnosisService {
  private diagnoses$ = new BehaviorSubject<CarDiagnosis[]>([]);

  constructor(private storageService: StorageService) {
    this.loadDiagnoses();
    this.storageService.changes$.subscribe(key => {
      if (['diagnoses'].includes(key)) {
        this.loadDiagnoses();
      }
    });
  }

  private loadDiagnoses(): void {
    const diagnoses = this.storageService.getItem<CarDiagnosis[]>('diagnoses') || [];
    this.diagnoses$.next(diagnoses);
  }

  private saveDiagnoses(diagnoses: CarDiagnosis[]): void {
    this.storageService.setItem('diagnoses', diagnoses);
    this.diagnoses$.next(diagnoses);
  }

  getDiagnoses(): Observable<CarDiagnosis[]> {
    return this.diagnoses$.asObservable();
  }

  getDiagnosisById(id: number): Observable<CarDiagnosis> {
    const diagnoses = this.diagnoses$.value;
    const diagnosis = diagnoses.find(d => d.id === id);
    if (diagnosis) {
      return of(diagnosis);
    }
    throw new Error('Diagnosis not found');
  }

  getDiagnosesByClient(clientId: number): Observable<CarDiagnosis[]> {
    const diagnoses = this.diagnoses$.value.filter(d => d.clienteId === clientId);
    return of(diagnoses);
  }

  getDiagnosesByVehicle(vehicleId: number): Observable<CarDiagnosis[]> {
    const diagnoses = this.diagnoses$.value.filter(d => d.vehiculoId === vehicleId);
    return of(diagnoses);
  }

  createDiagnosis(diagnosis: CarDiagnosis): Observable<CarDiagnosis> {
    const diagnoses = this.diagnoses$.value;
    const newId = this.generateId(diagnoses);
    const newDiagnosis = { ...diagnosis, id: newId };
    diagnoses.push(newDiagnosis);
    this.saveDiagnoses(diagnoses);
    return of(newDiagnosis);
  }

  updateDiagnosis(id: number, diagnosis: CarDiagnosis): Observable<CarDiagnosis> {
    const diagnoses = this.diagnoses$.value;
    const index = diagnoses.findIndex(d => d.id === id);
    if (index !== -1) {
      diagnoses[index] = { ...diagnosis, id };
      this.saveDiagnoses(diagnoses);
      return of(diagnoses[index]);
    }
    throw new Error('Diagnosis not found');
  }

  deleteDiagnosis(id: number): Observable<void> {
    const diagnoses = this.diagnoses$.value.filter(d => d.id !== id);
    this.saveDiagnoses(diagnoses);
    return of(void 0);
  }

  assignToClient(diagnosisId: number, clientId: number, clientName: string): Observable<CarDiagnosis> {
    const diagnoses = this.diagnoses$.value;
    const diagnosis = diagnoses.find(d => d.id === diagnosisId);
    if (diagnosis) {
      diagnosis.clienteId = clientId;
      diagnosis.clienteNombre = clientName;
      this.saveDiagnoses(diagnoses);
      return of(diagnosis);
    }
    throw new Error('Diagnosis not found');
  }

  assignToVehicle(diagnosisId: number, vehicleId: number, vehicleInfo: string): Observable<CarDiagnosis> {
    const diagnoses = this.diagnoses$.value;
    const diagnosis = diagnoses.find(d => d.id === diagnosisId);
    if (diagnosis) {
      diagnosis.vehiculoId = vehicleId;
      diagnosis.vehiculoInfo = vehicleInfo;
      this.saveDiagnoses(diagnoses);
      return of(diagnosis);
    }
    throw new Error('Diagnosis not found');
  }

  private generateId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }
}
