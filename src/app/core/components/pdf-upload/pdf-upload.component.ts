import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PdfService } from '../../services/pdf.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { t } from '../../i18n/i18n';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-upload',
  templateUrl: './pdf-upload.component.html',
  styleUrls: ['./pdf-upload.component.css']
})
export class PdfUploadComponent {
  @Output() pdfUploaded = new EventEmitter<{ filename: string; originalName: string; url: string }>();
  @Output() textExtracted = new EventEmitter<string>();

  selectedFile: File | null = null;
  isUploading = false;
  isProcessing = false;
  progress = 0;
  extractedText = '';
  translatedText = '';
  isTranslating = false;
  selectedTargetLang = 'en';

  constructor(
    private pdfService: PdfService,
    private snackBar: MatSnackBar
  ) {
    // Set up pdf.js worker using reliable CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.snackBar.open(t('Please select a PDF file'), t('Cerrar'), { duration: 3000 });
        return;
      }
      this.selectedFile = file;
    }
  }

  uploadPdf(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.pdfService.uploadPdf(this.selectedFile).subscribe({
      next: (result) => {
        this.isUploading = false;
        this.pdfUploaded.emit({
          filename: result.filename,
          originalName: result.originalName,
          url: result.url
        });
        this.snackBar.open(t('PDF uploaded successfully'), t('Cerrar'), { duration: 3000 });
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Upload error:', error);
        this.snackBar.open(t('Error uploading PDF'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  async extractText(): Promise<void> {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.progress = 0;

    try {
      // Convert PDF to text using pdf.js
      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      const totalPages = pdf.numPages;
      for (let i = 1; i <= totalPages; i++) {
        this.progress = Math.round((i / totalPages) * 100);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      this.extractedText = fullText.trim();
      this.textExtracted.emit(this.extractedText);
      this.isProcessing = false;
      this.snackBar.open(t('Text extracted successfully'), t('Cerrar'), { duration: 3000 });
    } catch (error) {
      this.isProcessing = false;
      console.error('PDF text extraction error:', error);
      this.snackBar.open(t('Error extracting text'), t('Cerrar'), { duration: 3000 });
    }
  }

  translateText(targetLang: string = 'en'): void {
    if (!this.extractedText) return;

    this.isTranslating = true;
    this.pdfService.translateText(this.extractedText, 'auto', targetLang).subscribe({
      next: (result) => {
        this.translatedText = result.translatedText;
        this.isTranslating = false;
        this.snackBar.open(t('Text translated successfully'), t('Cerrar'), { duration: 3000 });
      },
      error: (error) => {
        this.isTranslating = false;
        console.error('Translation error:', error);
        this.snackBar.open(t('Error translating text'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  clearFile(): void {
    this.selectedFile = null;
    this.extractedText = '';
    this.translatedText = '';
    this.progress = 0;
  }
}
