import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VehicleLookupResult {
  found: boolean;
  vin?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  version?: string;
  anio?: number | null;
  color?: string;
  combustible?: string;
  carroceria?: string;
  pais?: string;
  potencia?: string;
  motor?: string;
  cilindrada?: string;
  cambio?: string;
  fuente?: string[];
  source?: 'external' | 'local' | null;
  localMatches?: {
    customerId: number;
    customerName: string;
    vehicleId: number;
    marca: string;
    modelo: string;
    anio: number;
    color?: string;
    vin?: string;
    kilometraje?: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class VehicleLookupService {
  private apiUrl = '/api/vehicle-lookup';

  constructor(private http: HttpClient) {}

  lookupByVin(vin: string): Observable<VehicleLookupResult> {
    return this.http.get<VehicleLookupResult>(`${this.apiUrl}/vin/${encodeURIComponent(vin.trim())}`);
  }

  lookupByPlate(plate: string): Observable<VehicleLookupResult> {
    return this.http.get<VehicleLookupResult>(`${this.apiUrl}/plate/${encodeURIComponent(plate.trim())}`);
  }
}
