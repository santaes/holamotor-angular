import { Component, OnInit, HostListener } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
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
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

@Component({
  selector: 'app-diagnosis-management',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule, TranslatePipe, ReactiveFormsModule],
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
  diagnosisToPrint: CarDiagnosis | null = null;

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
      // Set up pdf.js worker for v6 legacy build
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.5.438/pdf.worker.min.mjs';

      // Load PDF
      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not get canvas context');
        }
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render page to canvas (pdf.js v6 API)
        const renderContext = {
          canvas: canvas,
          viewport: viewport
        };
        await page.render(renderContext).promise;

        // Convert canvas to image blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });

        // Extract text from image using Tesseract
        const result = await Tesseract.recognize(
          blob,
          'eng+spa',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                const overallProgress = ((i - 1) / totalPages) * 100 + (m.progress * 100 / totalPages);
                this.progress = Math.round(overallProgress);
              }
            }
          }
        );

        fullText += result.data.text + '\n\n';
      }

      this.extractedText = fullText.trim();
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

      if (!uploadResult) {
        this.isUploading = false;
        this.snackBar.open(t('Error al subir PDF'), t('Cerrar'), { duration: 3000 });
        return;
      }

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

  printDiagnosis(diagnosis: CarDiagnosis): void {
    this.diagnosisToPrint = diagnosis;
    // Let Angular render the printable block before opening the print dialog
    setTimeout(() => window.print(), 50);
  }

  printTranslation(): void {
    if (!this.translatedText) return;
    const formValue = this.diagnosisForm.value;
    const customer = this.customers.find(c => c.id === +formValue.clienteId);
    const vehicle = this.selectedVehicles.find(v => v.id === +formValue.vehiculoId);
    this.diagnosisToPrint = {
      fecha: new Date(),
      titulo: formValue.titulo || 'Diagnóstico',
      pdfFilename: '',
      pdfUrl: '',
      textoOriginal: this.extractedText,
      textoTraducido: this.translatedText,
      idiomaOriginal: 'auto',
      idiomaTraduccion: formValue.idiomaTraduccion,
      notas: formValue.notas,
      clienteNombre: customer ? `${customer.nombre} ${customer.apellido || ''}`.trim() : undefined,
      vehiculoInfo: vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})` : undefined
    };
    setTimeout(() => window.print(), 50);
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    this.diagnosisToPrint = null;
  }

  viewDiagnosis(diagnosis: CarDiagnosis): void {
    // Could open a dialog to view the diagnosis details
    window.open(diagnosis.pdfUrl, '_blank');
  }
}
