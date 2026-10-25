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
// @ts-ignore
import Tesseract from 'tesseract.js';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, TranslatePipe],
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
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.snackBar.open('Please select a PDF file', 'Close', { duration: 3000 });
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
        this.snackBar.open('PDF uploaded successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Upload error:', error);
        this.snackBar.open('Error uploading PDF', 'Close', { duration: 3000 });
      }
    });
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
      this.textExtracted.emit(this.extractedText);
      this.isProcessing = false;
      this.snackBar.open('Text extracted successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.isProcessing = false;
      console.error('OCR error:', error);
      this.snackBar.open('Error extracting text', 'Close', { duration: 3000 });
    }
  }

  translateText(targetLang: string = 'en'): void {
    if (!this.extractedText) return;

    this.isTranslating = true;
    this.pdfService.translateText(this.extractedText, 'auto', targetLang).subscribe({
      next: (result) => {
        this.translatedText = result.translatedText;
        this.isTranslating = false;
        this.snackBar.open('Text translated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.isTranslating = false;
        console.error('Translation error:', error);
        this.snackBar.open('Error translating text', 'Close', { duration: 3000 });
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
