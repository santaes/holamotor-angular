import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SettingsService } from './settings.service';

export interface VerifactuStatusResponse {
  status: string;
  message?: string;
}

export interface VerifactuInvoiceStatusRequest {
  serie: string;
  numero: string;
  fecha_expedicion: string;
  fecha_operacion?: string;
}

export interface VerifactuInvoiceStatusResponse {
  status: string;
  mensaje?: string;
  datos?: any;
}

export interface VerifactuInvoiceLine {
  concepto: string;
  cantidad: number;
  precio: number;
  tipo_iva?: string;
  descuento?: number;
}

export interface VerifactuEmitter {
  nif: string;
  nombre?: string;
  nombre_comercial?: string;
}

export interface VerifactuReceiver {
  nif: string;
  nombre: string;
  direccion?: string;
  provincia?: string;
  pais?: string;
  codigo_postal?: string;
}

export interface VerifactuCreateInvoiceRequest {
  serie: string;
  numero: string;
  fecha_expedicion: string;
  fecha_operacion?: string;
  emisor: VerifactuEmitter;
  receptor: VerifactuReceiver;
  lineas: VerifactuInvoiceLine[];
  tipo_factura?: 'F1' | 'F2';
  clave_regimen_iva?: string;
  importe_total: number;
  fecha_vencimiento?: string;
  descripcion?: string;
}

export interface VerifactuCreateInvoiceResponse {
  id: string;
  status: string;
  mensaje?: string;
  qr_code?: string;
  firma?: string;
}

// AEAT VeriFactu compliant structures
export interface FacturaOnlineInvoiceRequest {
  factura: {
    IDEmisorFactura: string;
    NumSerieFactura: string;
    FechaExpedicionFactura: string;
    HoraExpedicionFactura: string;
    Destinatarios: Array<{
      NIF: string;
      NombreRazon: string;
    }>;
    TipoDesglose: {
      DesgloseFactura: {
        Sujeta: {
          NoExenta: {
            TipoNoExenta: string;
            DesgloseIVA: Array<{
              BaseImponible: string;
              TipoImpositivo: string;
              CuotaRepercutida: string;
            }>;
          };
        };
      };
    };
    ImporteTotal: string;
    Descripcion?: string;
    Vencimiento?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class VerifactuService {
  private readonly API_BASE_URL = 'https://api.verifacti.com';
  private readonly SANDBOX_BASE_URL = 'https://sandbox.verifacti.com';

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService
  ) {}

  private getApiKey(): string {
    return this.settingsService.value.verifactuApiKey || '';
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json'
    });
  }

  private getBaseUrl(): string {
    return this.settingsService.value.verifactuSandbox ? this.SANDBOX_BASE_URL : this.API_BASE_URL;
  }

  /**
   * Check API status
   */
  getApiStatus(): Observable<VerifactuStatusResponse> {
    if (!this.getApiKey()) {
      return throwError(() => new Error('Verifactu API key not configured'));
    }

    return this.http.get<VerifactuStatusResponse>(
      `${this.getBaseUrl()}/verifactu/status`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Verifactu API status error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get invoice status from AEAT
   */
  getInvoiceStatus(request: VerifactuInvoiceStatusRequest): Observable<VerifactuInvoiceStatusResponse> {
    if (!this.getApiKey()) {
      return throwError(() => new Error('Verifactu API key not configured'));
    }

    return this.http.post<VerifactuInvoiceStatusResponse>(
      `${this.getBaseUrl()}/verifactu/status`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Verifactu invoice status error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create and submit a new invoice to Verifactu/AEAT
   */
  createInvoice(request: VerifactuCreateInvoiceRequest): Observable<VerifactuCreateInvoiceResponse> {
    if (!this.getApiKey()) {
      return throwError(() => new Error('Verifactu API key not configured'));
    }

    return this.http.post<VerifactuCreateInvoiceResponse>(
      `${this.getBaseUrl()}/verifactu/create`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Verifactu create invoice error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if Verifactu is configured
   */
  isConfigured(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Send invoice to FacturaOnline/VeriFactu (AEAT compliant)
   */
  sendInvoice(request: FacturaOnlineInvoiceRequest): Observable<any> {
    if (!this.getApiKey()) {
      return throwError(() => new Error('Verifactu API key not configured'));
    }

    return this.http.post(
      `${this.getBaseUrl()}/facturae/enviar`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Verifactu send invoice error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get VeriFactu signature for an invoice
   */
  getInvoiceSignature(invoiceId: string): Observable<any> {
    if (!this.getApiKey()) {
      return throwError(() => new Error('Verifactu API key not configured'));
    }

    return this.http.get(
      `${this.getBaseUrl()}/verifactu/signature/${invoiceId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Verifactu signature error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate QR code for VeriFactu compliance
   */
  generateQRCode(invoiceData: any): string {
    // QR code format for VeriFactu: 
    // Includes: NIF emitter, invoice number, date, total amount, signature
    const qrData = [
      invoiceData.IDEmisorFactura,
      invoiceData.NumSerieFactura,
      invoiceData.FechaExpedicionFactura,
      invoiceData.ImporteTotal,
      invoiceData.firma || ''
    ].join('|');
    
    return btoa(qrData);
  }
}
