import { Component, Output, EventEmitter, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PdfService } from '../../services/pdf.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { t } from '../../i18n/i18n';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TranslatePipe
  ],
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
  pdfUrl: SafeResourceUrl | null = null;

  constructor(
    private pdfService: PdfService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer
  ) {
    // Set up pdf.js worker for v6 legacy build
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.5.438/pdf.worker.min.mjs';
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
      // Create object URL for PDF preview
      if (this.pdfUrl) {
        URL.revokeObjectURL(this.pdfUrl as any);
      }
      const blobUrl = URL.createObjectURL(file);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      this.cdr.detectChanges();
    }
  }

  uploadPdf(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.cdr.detectChanges();
    this.pdfService.uploadPdf(this.selectedFile).subscribe({
      next: (result) => {
        this.ngZone.run(() => {
          this.isUploading = false;
          this.cdr.detectChanges();
        });
        this.pdfUploaded.emit({
          filename: result.filename,
          originalName: result.originalName,
          url: result.url
        });
        this.snackBar.open(t('PDF uploaded successfully'), t('Cerrar'), { duration: 3000 });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.isUploading = false;
          this.cdr.detectChanges();
        });
        console.error('Upload error:', error);
        this.snackBar.open(t('Error uploading PDF'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  async extractText(): Promise<void> {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.progress = 0;
    this.cdr.detectChanges();

    try {
      // Convert PDF to text using pdf.js
      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      const totalPages = pdf.numPages;
      for (let i = 1; i <= totalPages; i++) {
        this.ngZone.run(() => {
          this.progress = Math.round((i / totalPages) * 100);
        });
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += this.extractPageText(textContent.items) + '\n';
      }

      this.ngZone.run(() => {
        this.extractedText = fullText.trim();
        this.isProcessing = false;
        this.cdr.detectChanges();
      });
      this.textExtracted.emit(this.extractedText);
      this.snackBar.open(t('Text extracted successfully'), t('Cerrar'), { duration: 3000 });
    } catch (error) {
      this.ngZone.run(() => {
        this.isProcessing = false;
        this.cdr.detectChanges();
      });
      console.error('PDF text extraction error:', error);
      this.snackBar.open(t('Error extracting text'), t('Cerrar'), { duration: 3000 });
    }
  }

  /**
   * Rebuild text lines from pdf.js text items using their Y coordinates
   * and hasEOL flags, preserving the original layout (line breaks).
   */
  private extractPageText(items: any[]): string {
    let text = '';
    let prevY: number | null = null;

    for (const item of items) {
      const str = item.str ?? '';
      if (!str) continue;

      const y = item.transform?.[5];
      const newLine = prevY !== null && typeof y === 'number' && Math.abs(y - prevY) > 2;

      if (newLine) {
        text += '\n';
      } else if (text && !/\s$/.test(text) && !/^\s/.test(str)) {
        text += ' ';
      }

      text += str;
      if (item.hasEOL) text += '\n';
      if (typeof y === 'number') prevY = y;
    }

    return text.replace(/\n{3,}/g, '\n\n').trimEnd();
  }

  translateText(targetLang: string = 'en'): void {
    if (!this.extractedText) return;

    this.isTranslating = true;
    this.cdr.detectChanges();
    this.pdfService.translateText(this.extractedText, 'auto', targetLang).subscribe({
      next: (result) => {
        this.ngZone.run(() => {
          this.translatedText = result.translatedText;
          this.isTranslating = false;
          this.cdr.detectChanges();
        });
        this.snackBar.open(t('Text translated successfully'), t('Cerrar'), { duration: 3000 });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.isTranslating = false;
          this.cdr.detectChanges();
        });
        console.error('Translation error:', error);
        this.snackBar.open(t('Error translating text'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  printTranslatedText(): void {
    if (!this.translatedText) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.snackBar.open(t('Could not open print window'), t('Cerrar'), { duration: 3000 });
      return;
    }

    // Format the translated text for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('Translated Diagnostic Report')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .content {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="content">${this.translatedText}</div>
        <div class="footer">
          <p>Generated by HolaMotor Workshop Management System</p>
          <p>Date: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for the content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  clearFile(): void {
    this.ngZone.run(() => {
      this.selectedFile = null;
      this.extractedText = '';
      this.translatedText = '';
      this.progress = 0;
      if (this.pdfUrl) {
        URL.revokeObjectURL(this.pdfUrl as any);
        this.pdfUrl = null;
      }
      this.cdr.detectChanges();
    });
  }

  printPdf(): void {
    if (!this.pdfUrl || !this.selectedFile) return;

    const blobUrl = URL.createObjectURL(this.selectedFile);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(blobUrl);
      };
    } else {
      this.snackBar.open(t('Could not open PDF for printing'), t('Cerrar'), { duration: 3000 });
    }
  }
}
