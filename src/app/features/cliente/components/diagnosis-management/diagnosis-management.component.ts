import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { t } from '../../../../core/i18n/i18n';
import { CarDiagnosis } from '../../models/diagnosis.model';
import { DiagnosisService } from '../../services/diagnosis.service';
import { CustomerService } from '../../services/customer.service';
import { StorageService } from '../../../../core/services/storage.service';
import { PdfService } from '../../../../core/services/pdf.service';
// @ts-ignore
import Tesseract from 'tesseract.js';

@Component({
  selector: 'app-diagnosis-management',
  templateUrl: './diagnosis-management.component.html',
  styleUrls: ['./diagnosis-management.component.css']
})
export class DiagnosisManagementComponent implements OnInit {
  diagnoses: CarDiagnosis[] = [];
  customers: any[] = [];
  selectedVehicles: any[] = [];
  isLoading = true;

  diagnosisForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  isProcessing = false;
  isTranslating = false;
  progress = 0;
  extractedText = '';
  translatedText = '';
  selectedTargetLang = 'en';

  constructor(
    private fb: FormBuilder,
    private diagnosisService: DiagnosisService,
    private customerService: CustomerService,
    private storageService: StorageService,
    private pdfService: PdfService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.diagnosisForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadDiagnoses();
    this.loadCustomers();
    this.setupCustomerPicker();
  }

  createForm(): FormGroup {
    return this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(2)]],
      clienteId: [''],
      vehiculoId: [''],
      notas: [''],
      idiomaTraduccion: ['en']
    });
  }

  loadDiagnoses(): void {
    this.diagnosisService.getDiagnoses().subscribe({
      next: (diagnoses) => {
        this.diagnoses = diagnoses;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading diagnoses:', error);
        this.snackBar.open(t('Error al cargar diagnósticos'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadCustomers(): void {
    this.customers = this.storageService.getItem<any[]>('customers') || [];
  }

  setupCustomerPicker(): void {
    this.diagnosisForm.get('clienteId')?.valueChanges.subscribe(clientId => {
      const customer = this.customers.find(c => c.id === +clientId);
      this.selectedVehicles = customer?.vehiculos || [];
      if (customer) {
        this.diagnosisForm.patchValue({ vehiculoId: '' }, { emitEvent: false });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.snackBar.open(t('Por favor seleccione un archivo PDF'), t('Cerrar'), { duration: 3000 });
        return;
      }
      this.selectedFile = file;
    }
  }

  triggerFileInput(): void {
    const input = document.getElementById('pdfInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  async extractText(): Promise<void> {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.progress = 0;

    try {
      const result = await Tesseract.recognize(
        this.selectedFile,
        'eng+spa',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              this.progress = Math.round(m.progress * 100);
            }
          }
        }
      );

      this.extractedText = result.data.text;
      this.isProcessing = false;
      this.snackBar.open(t('Texto extraído exitosamente'), t('Cerrar'), { duration: 3000 });
    } catch (error) {
      this.isProcessing = false;
      console.error('OCR error:', error);
      this.snackBar.open(t('Error al extraer texto'), t('Cerrar'), { duration: 3000 });
    }
  }

  translateText(): void {
    if (!this.extractedText) return;

    const targetLang = this.diagnosisForm.get('idiomaTraduccion')?.value || 'en';
    this.isTranslating = true;

    this.pdfService.translateText(this.extractedText, 'auto', targetLang).subscribe({
      next: (result) => {
        this.translatedText = result.translatedText;
        this.isTranslating = false;
        this.snackBar.open(t('Texto traducido exitosamente'), t('Cerrar'), { duration: 3000 });
      },
      error: (error) => {
        this.isTranslating = false;
        console.error('Translation error:', error);
        this.snackBar.open(t('Error al traducir texto'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  async saveDiagnosis(): Promise<void> {
    if (!this.selectedFile || !this.diagnosisForm.valid) {
      this.snackBar.open(t('Por favor complete todos los campos requeridos'), t('Cerrar'), { duration: 3000 });
      return;
    }

    this.isUploading = true;

    try {
      // Upload PDF first
      const uploadResult = await this.pdfService.uploadPdf(this.selectedFile).toPromise();

      const formValue = this.diagnosisForm.value;
      const customer = this.customers.find(c => c.id === +formValue.clienteId);
      const vehicle = this.selectedVehicles.find(v => v.id === +formValue.vehiculoId);

      const diagnosis: CarDiagnosis = {
        fecha: new Date(),
        titulo: formValue.titulo,
        pdfFilename: uploadResult.filename,
        pdfUrl: uploadResult.url,
        textoOriginal: this.extractedText,
        textoTraducido: this.translatedText || undefined,
        idiomaOriginal: 'auto',
        idiomaTraduccion: this.translatedText ? formValue.idiomaTraduccion : undefined,
        notas: formValue.notas,
        clienteId: formValue.clienteId ? +formValue.clienteId : undefined,
        clienteNombre: customer ? `${customer.nombre} ${customer.apellido}` : undefined,
        vehiculoId: formValue.vehiculoId ? +formValue.vehiculoId : undefined,
        vehiculoInfo: vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})` : undefined
      };

      this.diagnosisService.createDiagnosis(diagnosis).subscribe({
        next: () => {
          this.isUploading = false;
          this.snackBar.open(t('Diagnóstico guardado exitosamente'), t('Cerrar'), { duration: 3000 });
          this.resetForm();
          this.loadDiagnoses();
        },
        error: (error) => {
          this.isUploading = false;
          console.error('Error saving diagnosis:', error);
          this.snackBar.open(t('Error al guardar diagnóstico'), t('Cerrar'), { duration: 3000 });
        }
      });
    } catch (error) {
      this.isUploading = false;
      console.error('Upload error:', error);
      this.snackBar.open(t('Error al subir PDF'), t('Cerrar'), { duration: 3000 });
    }
  }

  resetForm(): void {
    this.diagnosisForm.reset();
    this.selectedFile = null;
    this.extractedText = '';
    this.translatedText = '';
    this.progress = 0;
    this.selectedVehicles = [];
  }

  deleteDiagnosis(id: number): void {
    this.diagnosisService.deleteDiagnosis(id).subscribe({
      next: () => {
        this.snackBar.open(t('Diagnóstico eliminado'), t('Cerrar'), { duration: 3000 });
        this.loadDiagnoses();
      },
      error: (error) => {
        console.error('Error deleting diagnosis:', error);
        this.snackBar.open(t('Error al eliminar diagnóstico'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  viewDiagnosis(diagnosis: CarDiagnosis): void {
    // Could open a dialog to view the diagnosis details
    window.open(diagnosis.pdfUrl, '_blank');
  }
}
