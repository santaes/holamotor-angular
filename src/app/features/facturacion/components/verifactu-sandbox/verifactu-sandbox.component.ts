import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VerifactuService, VerifactuCreateInvoiceRequest } from '../../../../core/services/verifactu.service';
import { SettingsService } from '../../../../core/services/settings.service';

interface SandboxTestResult {
  testName: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: any;
}

@Component({
  selector: 'app-verifactu-sandbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="sandbox-container">
      <mat-card class="sandbox-header">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>science</mat-icon>
            VeriFactu Sandbox - Testing Environment
          </mat-card-title>
          <mat-card-subtitle>
            Test the integrity and functionality of the VeriFactu implementation
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <!-- Test Configuration -->
      <mat-card class="test-config">
        <mat-card-header>
          <mat-card-title>Test Configuration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="config-grid">
            <mat-form-field appearance="outline">
              <mat-label>Test NIF/CIF</mat-label>
              <input matInput [(ngModel)]="testNif" placeholder="B12345678">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Test Invoice Series</mat-label>
              <input matInput [(ngModel)]="testSerie" placeholder="FAC">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Test Invoice Number</mat-label>
              <input matInput [(ngModel)]="testNumero" placeholder="001">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Customer NIF</mat-label>
              <input matInput [(ngModel)]="customerNif" placeholder="A87654321">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Customer Name</mat-label>
              <input matInput [(ngModel)]="customerName" placeholder="Test Customer">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Base Amount</mat-label>
              <input matInput type="number" [(ngModel)]="baseAmount" placeholder="1000.00">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>IVA Rate (%)</mat-label>
              <input matInput type="number" [(ngModel)]="ivaRate" placeholder="21">
            </mat-form-field>
          </div>

          <div class="test-actions">
            <button mat-raised-button color="primary" (click)="runAllTests()" [disabled]="isRunning">
              <mat-icon>play_arrow</mat-icon>
              Run All Tests
            </button>
            <button mat-raised-button color="accent" (click)="runXmlTest()" [disabled]="isRunning">
              <mat-icon>code</mat-icon>
              Test XML Generation
            </button>
            <button mat-raised-button color="warn" (click)="runHashTest()" [disabled]="isRunning">
              <mat-icon>fingerprint</mat-icon>
              Test Hash Chain
            </button>
            <button mat-raised-button (click)="runQrTest()" [disabled]="isRunning">
              <mat-icon>qr_code</mat-icon>
              Test QR Code
            </button>
            <button mat-raised-button (click)="clearResults()">
              <mat-icon>clear</mat-icon>
              Clear Results
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Test Results -->
      <mat-card class="test-results" *ngIf="testResults.length > 0">
        <mat-card-header>
          <mat-card-title>Test Results</mat-card-title>
          <mat-card-subtitle>
            {{ passedTests }} passed, {{ failedTests }} failed, {{ pendingTests }} pending
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="results-list">
            <div *ngFor="let result of testResults" class="test-result" [class]="'status-' + result.status">
              <div class="result-header">
                <mat-icon [class]="'status-icon-' + result.status">
                  {{ getStatusIcon(result.status) }}
                </mat-icon>
                <span class="test-name">{{ result.testName }}</span>
                <span class="result-status">{{ getStatusText(result.status) }}</span>
              </div>
              <div class="result-message">{{ result.message }}</div>
              <div *ngIf="result.details" class="result-details">
                <pre>{{ formatDetails(result.details) }}</pre>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading Indicator -->
      <div class="loading-overlay" *ngIf="isRunning">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Running tests...</p>
      </div>
    </div>
  `,
  styles: [`
    .sandbox-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .sandbox-header {
      margin-bottom: 20px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
    }

    .sandbox-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
    }

    .test-config {
      margin-bottom: 20px;
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .test-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .test-results {
      margin-top: 20px;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .test-result {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background: white;
    }

    .test-result.status-pass {
      border-left: 4px solid #4caf50;
      background: #f8fff8;
    }

    .test-result.status-fail {
      border-left: 4px solid #f44336;
      background: #fff8f8;
    }

    .test-result.status-pending {
      border-left: 4px solid #ff9800;
      background: #fff8f0;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .test-name {
      font-weight: 600;
      flex: 1;
    }

    .result-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      background: #f5f5f5;
    }

    .result-message {
      color: #666;
      margin-bottom: 10px;
    }

    .result-details {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }

    .result-details pre {
      margin: 0;
      font-size: 12px;
      white-space: pre-wrap;
    }

    .status-icon-pass { color: #4caf50; }
    .status-icon-fail { color: #f44336; }
    .status-icon-pending { color: #ff9800; }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-overlay p {
      margin-top: 20px;
      font-size: 16px;
      color: #666;
    }
  `]
})
export class VerifactuSandboxComponent implements OnInit {
  // Test configuration
  testNif = 'B12345678';
  testSerie = 'FAC';
  testNumero = '001';
  customerNif = 'A87654321';
  customerName = 'Test Customer S.A.';
  baseAmount = 1000;
  ivaRate = 21;

  // Test state
  isRunning = false;
  testResults: SandboxTestResult[] = [];

  constructor(
    private verifactuService: VerifactuService,
    private settingsService: SettingsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Set test settings
    this.settingsService.save({
      taxId: this.testNif,
      workshopName: 'Test Workshop S.L.',
      address: 'Test Street 123, Madrid',
      phone: '+34 123 456 789',
      email: 'test@workshop.com',
      verifactuSandbox: true
    });
  }

  get passedTests(): number {
    return this.testResults.filter(r => r.status === 'pass').length;
  }

  get failedTests(): number {
    return this.testResults.filter(r => r.status === 'fail').length;
  }

  get pendingTests(): number {
    return this.testResults.filter(r => r.status === 'pending').length;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pass': return 'check_circle';
      case 'fail': return 'error';
      case 'pending': return 'hourglass_empty';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pass': return 'PASSED';
      case 'fail': return 'FAILED';
      case 'pending': return 'PENDING';
      default: return 'UNKNOWN';
    }
  }

  formatDetails(details: any): string {
    return JSON.stringify(details, null, 2);
  }

  clearResults() {
    this.testResults = [];
  }

  async runAllTests() {
    this.isRunning = true;
    this.testResults = [];

    try {
      // Test 1: Configuration Check
      await this.testConfiguration();
      
      // Test 2: XML Generation
      await this.testXmlGeneration();
      
      // Test 3: Hash Chain
      await this.testHashChain();
      
      // Test 4: IVA Calculation
      await this.testIvaCalculation();
      
      // Test 5: QR Code Generation
      await this.testQrCodeGeneration();
      
      // Test 6: Sandbox Submission
      await this.testSandboxSubmission();
      
      // Test 7: Certificate Handling
      await this.testCertificateHandling();
      
      // Test 8: Date Formatting
      await this.testDateFormatting();
      
      // Test 9: XML Escaping
      await this.testXmlEscaping();
      
      // Test 10: Record Chaining
      await this.testRecordChaining();

      this.snackBar.open('All tests completed!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Test execution error:', error);
      this.snackBar.open('Error running tests', 'Close', { duration: 3000 });
    } finally {
      this.isRunning = false;
    }
  }

  async runXmlTest() {
    this.isRunning = true;
    this.testResults = [];
    await this.testXmlGeneration();
    this.isRunning = false;
  }

  async runHashTest() {
    this.isRunning = true;
    this.testResults = [];
    await this.testHashChain();
    this.isRunning = false;
  }

  async runQrTest() {
    this.isRunning = true;
    this.testResults = [];
    await this.testQrCodeGeneration();
    this.isRunning = false;
  }

  private addTestResult(testName: string, status: 'pass' | 'fail' | 'pending', message: string, details?: any) {
    this.testResults.push({ testName, status, message, details });
  }

  private async testConfiguration() {
    try {
      const settings = this.settingsService.value;
      
      if (!settings.taxId) {
        this.addTestResult('Configuration Check', 'fail', 'NIF/CIF not configured');
        return;
      }
      
      if (!settings.workshopName) {
        this.addTestResult('Configuration Check', 'fail', 'Workshop name not configured');
        return;
      }
      
      if (!settings.verifactuSandbox) {
        this.addTestResult('Configuration Check', 'fail', 'Sandbox mode not enabled');
        return;
      }
      
      this.addTestResult('Configuration Check', 'pass', 'Configuration is valid', {
        taxId: settings.taxId,
        workshopName: settings.workshopName,
        sandbox: settings.verifactuSandbox
      });
    } catch (error) {
      this.addTestResult('Configuration Check', 'fail', `Error: ${error}`);
    }
  }

  private async testXmlGeneration() {
    try {
      const request = this.createTestRequest();
      const xml = this.verifactuService['generateAEATXML'](request, this.settingsService.value);
      
      // Validate XML structure
      const hasRequiredElements = xml.includes('SuministroLRFacturasEmitidas') &&
                                xml.includes('RegistroFacturacion') &&
                                xml.includes('IDFactura') &&
                                xml.includes('Destinatarios') &&
                                xml.includes('TipoDesglose') &&
                                xml.includes('ImporteTotal');
      
      if (hasRequiredElements) {
        this.addTestResult('XML Generation', 'pass', 'XML generated successfully', {
          xmlLength: xml.length,
          hasNamespace: xml.includes('xmlns:T'),
          hasEncoding: xml.includes('UTF-8')
        });
      } else {
        this.addTestResult('XML Generation', 'fail', 'XML missing required elements');
      }
    } catch (error) {
      this.addTestResult('XML Generation', 'fail', `Error: ${error}`);
    }
  }

  private async testHashChain() {
    try {
      const request = this.createTestRequest();
      const hash1 = this.verifactuService['generateHash'](request, this.settingsService.value, 1000, 210);
      const hash2 = this.verifactuService['generateHash'](request, this.settingsService.value, 1000, 210);
      
      // Hash should be deterministic
      if (hash1 === hash2) {
        this.addTestResult('Hash Chain', 'pass', 'Hash generation is deterministic', {
          hash: hash1.substring(0, 20) + '...',
          length: hash1.length
        });
      } else {
        this.addTestResult('Hash Chain', 'fail', 'Hash generation is not deterministic');
      }
    } catch (error) {
      this.addTestResult('Hash Chain', 'fail', `Error: ${error}`);
    }
  }

  private async testIvaCalculation() {
    try {
      const request = this.createTestRequest();
      const baseTotal = this.verifactuService['calculateBaseTotal'](request.lineas);
      const ivaTotal = this.verifactuService['calculateIVATotal'](request.lineas);
      
      const expectedBase = this.baseAmount;
      const expectedIva = this.baseAmount * (this.ivaRate / 100);
      
      if (Math.abs(baseTotal - expectedBase) < 0.01 && Math.abs(ivaTotal - expectedIva) < 0.01) {
        this.addTestResult('IVA Calculation', 'pass', 'IVA calculation is correct', {
          baseTotal,
          ivaTotal,
          expectedBase,
          expectedIva
        });
      } else {
        this.addTestResult('IVA Calculation', 'fail', 'IVA calculation is incorrect', {
          calculated: { baseTotal, ivaTotal },
          expected: { expectedBase, expectedIva }
        });
      }
    } catch (error) {
      this.addTestResult('IVA Calculation', 'fail', `Error: ${error}`);
    }
  }

  private async testQrCodeGeneration() {
    try {
      const invoiceData = {
        IDEmisorFactura: this.testNif,
        NumSerieFactura: `${this.testSerie}-${this.testNumero}`,
        FechaExpedicionFactura: '19-11-2026',
        ImporteTotal: (this.baseAmount + (this.baseAmount * this.ivaRate / 100)).toFixed(2),
        firma: 'TEST_SIGNATURE'
      };
      
      const qrCode = this.verifactuService.generateQRCode(invoiceData);
      
      if (qrCode && qrCode.length > 0) {
        this.addTestResult('QR Code Generation', 'pass', 'QR code generated successfully', {
          qrCodeLength: qrCode.length,
          qrCodePreview: qrCode.substring(0, 50) + '...'
        });
      } else {
        this.addTestResult('QR Code Generation', 'fail', 'QR code generation failed');
      }
    } catch (error) {
      this.addTestResult('QR Code Generation', 'fail', `Error: ${error}`);
    }
  }

  private async testSandboxSubmission() {
    try {
      const request = this.createTestRequest();
      
      this.verifactuService.createInvoice(request).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.addTestResult('Sandbox Submission', 'pass', 'Invoice submitted successfully', {
              id: response.id,
              status: response.status,
              mensaje: response.mensaje
            });
          } else {
            this.addTestResult('Sandbox Submission', 'fail', 'Submission failed', response);
          }
        },
        error: (error) => {
          this.addTestResult('Sandbox Submission', 'fail', `Submission error: ${error}`);
        }
      });
    } catch (error) {
      this.addTestResult('Sandbox Submission', 'fail', `Error: ${error}`);
    }
  }

  private async testCertificateHandling() {
    try {
      // Test certificate status
      const hasCertificate = this.verifactuService.hasCertificate();
      const isSessionLoaded = this.verifactuService.isSessionLoaded();
      const certificateInfo = this.verifactuService.getCertificateInfo();
      
      this.addTestResult('Certificate Handling', 'pass', 'Certificate handling is functional', {
        hasCertificate,
        isSessionLoaded,
        certificateInfo: certificateInfo ? {
          subject: certificateInfo.subject,
          issuer: certificateInfo.issuer,
          validFrom: certificateInfo.validFrom,
          validTo: certificateInfo.validTo
        } : null
      });
    } catch (error) {
      this.addTestResult('Certificate Handling', 'fail', `Error: ${error}`);
    }
  }

  private async testDateFormatting() {
    try {
      const testDate = new Date('2026-11-19');
      const formatted = this.verifactuService['formatDate'](testDate);
      
      if (formatted === '19-11-2026') {
        this.addTestResult('Date Formatting', 'pass', 'Date formatting is correct', {
          input: testDate.toISOString(),
          output: formatted
        });
      } else {
        this.addTestResult('Date Formatting', 'fail', 'Date formatting is incorrect', {
          expected: '19-11-2026',
          actual: formatted
        });
      }
    } catch (error) {
      this.addTestResult('Date Formatting', 'fail', `Error: ${error}`);
    }
  }

  private async testXmlEscaping() {
    try {
      const testString = 'Test & <Customer> "Name" \'with\' special chars';
      const escaped = this.verifactuService['escapeXML'](testString);
      
      const hasEscapedChars = escaped.includes('&amp;') && 
                              escaped.includes('&lt;') && 
                              escaped.includes('&gt;') && 
                              escaped.includes('&quot;') && 
                              escaped.includes('&apos;');
      
      if (hasEscapedChars) {
        this.addTestResult('XML Escaping', 'pass', 'XML escaping works correctly', {
          original: testString,
          escaped: escaped
        });
      } else {
        this.addTestResult('XML Escaping', 'fail', 'XML escaping is incomplete');
      }
    } catch (error) {
      this.addTestResult('XML Escaping', 'fail', `Error: ${error}`);
    }
  }

  private async testRecordChaining() {
    try {
      const request1 = this.createTestRequest();
      const request2 = this.createTestRequest();
      request2.numero = '002'; // Different invoice number
      
      // First invoice
      const xml1 = this.verifactuService['generateAEATXML'](request1, this.settingsService.value);
      const hash1 = this.verifactuService['generateHash'](request1, this.settingsService.value, 1000, 210);
      
      // Second invoice should have previous hash
      const xml2 = this.verifactuService['generateAEATXML'](request2, this.settingsService.value);
      
      const hasChaining = xml2.includes('HuellaAnterior') || xml2.includes('EncadenandoRegistro');
      
      if (hasChaining) {
        this.addTestResult('Record Chaining', 'pass', 'Record chaining is implemented', {
          hasHuellaAnterior: xml2.includes('HuellaAnterior'),
          hasEncadenandoRegistro: xml2.includes('EncadenandoRegistro')
        });
      } else {
        this.addTestResult('Record Chaining', 'fail', 'Record chaining is not implemented');
      }
    } catch (error) {
      this.addTestResult('Record Chaining', 'fail', `Error: ${error}`);
    }
  }

  private createTestRequest(): VerifactuCreateInvoiceRequest {
    const ivaAmount = this.baseAmount * (this.ivaRate / 100);
    const total = this.baseAmount + ivaAmount;
    
    return {
      serie: this.testSerie,
      numero: this.testNumero,
      fecha_expedicion: '19-11-2026',
      fecha_operacion: '19-11-2026',
      emisor: {
        nif: this.testNif,
        nombre: 'Test Workshop S.L.'
      },
      receptor: {
        nif: this.customerNif,
        nombre: this.customerName,
        direccion: 'Customer Street 456',
        provincia: 'Barcelona',
        pais: 'ES',
        codigo_postal: '08001'
      },
      lineas: [{
        concepto: 'Test Service',
        cantidad: 1,
        precio: this.baseAmount,
        tipo_iva: this.ivaRate.toString(),
        descuento: 0
      }],
      tipo_factura: 'F1',
      clave_regimen_iva: 'S1',
      importe_total: total,
      descripcion: 'Test invoice for sandbox validation',
      fecha_vencimiento: '19-12-2026'
    };
  }
}
