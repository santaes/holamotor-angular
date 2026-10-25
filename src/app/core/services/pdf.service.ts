import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PdfUploadResult {
  success: boolean;
  filename: string;
  originalName: string;
  url: string;
}

export interface TranslationResult {
  translatedText: string;
  source: string;
  target: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  uploadPdf(file: File): Observable<PdfUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PdfUploadResult>(`${this.apiUrl}/pdf/upload`, formData);
  }

  translateText(text: string, source: string = 'auto', target: string = 'en'): Observable<TranslationResult> {
    return this.http.post<TranslationResult>(`${this.apiUrl}/translate`, {
      text,
      source,
      target
    });
  }

  getPdfUrl(filename: string): string {
    return `${this.apiUrl}/pdf/${filename}`;
  }
}
