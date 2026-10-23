import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Invoice, Quote } from '../models/billing.model';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private invoices$ = new BehaviorSubject<Invoice[]>([]);
  private quotes$ = new BehaviorSubject<Quote[]>([]);

  constructor(private storageService: StorageService) {
    this.loadData();
  }

  private loadData(): void {
    const invoices = this.storageService.getItem<Invoice[]>('invoices') || [];
    this.invoices$.next(invoices);
    const quotes = this.storageService.getItem<Quote[]>('quotes') || [];
    this.quotes$.next(quotes);
  }

  private saveInvoices(invoices: Invoice[]): void {
    this.storageService.setItem('invoices', invoices);
    this.invoices$.next(invoices);
  }

  private saveQuotes(quotes: Quote[]): void {
    this.storageService.setItem('quotes', quotes);
    this.quotes$.next(quotes);
  }

  // Invoices
  getInvoices(): Observable<Invoice[]> {
    return this.invoices$.asObservable();
  }

  getInvoiceById(id: number): Observable<Invoice> {
    const invoices = this.invoices$.value;
    const invoice = invoices.find(i => i.id === id);
    if (invoice) {
      return of(invoice);
    }
    throw new Error('Invoice not found');
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    const invoices = this.invoices$.value;
    const newInvoice = { ...invoice, id: this.generateId(invoices) };
    invoices.push(newInvoice);
    this.saveInvoices(invoices);
    return of(newInvoice);
  }

  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    const invoices = this.invoices$.value;
    const index = invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      invoices[index] = { ...invoice, id };
      this.saveInvoices(invoices);
      return of(invoices[index]);
    }
    throw new Error('Invoice not found');
  }

  deleteInvoice(id: number): Observable<void> {
    const invoices = this.invoices$.value.filter(i => i.id !== id);
    this.saveInvoices(invoices);
    return of(void 0);
  }

  updateInvoiceStatus(id: number, estado: Invoice['estado']): Observable<Invoice> {
    const invoices = this.invoices$.value;
    const index = invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      invoices[index].estado = estado;
      this.saveInvoices(invoices);
      return of(invoices[index]);
    }
    throw new Error('Invoice not found');
  }

  addPayment(invoiceId: number, payment: any): Observable<Invoice> {
    const invoices = this.invoices$.value;
    const index = invoices.findIndex(i => i.id === invoiceId);
    if (index !== -1) {
      const newPayment = { ...payment, id: this.generateId(invoices[index].pagos || []) };
      if (!invoices[index].pagos) invoices[index].pagos = [];
      invoices[index].pagos.push(newPayment);
      const totalPaid = invoices[index].pagos.reduce((sum, p) => sum + p.monto, 0);
      if (totalPaid >= invoices[index].total) {
        invoices[index].estado = 'Pagada';
      }
      this.saveInvoices(invoices);
      return of(invoices[index]);
    }
    throw new Error('Invoice not found');
  }

  getInvoicesByCustomer(customerId: number): Observable<Invoice[]> {
    const invoices = this.invoices$.value.filter(i => i.clienteId === customerId);
    return of(invoices);
  }

  getPendingInvoices(): Observable<Invoice[]> {
    const invoices = this.invoices$.value.filter(i => i.estado === 'Enviada');
    return of(invoices);
  }

  getOverdueInvoices(): Observable<Invoice[]> {
    const today = new Date();
    const invoices = this.invoices$.value.filter(i => {
      const dueDate = new Date(i.fechaVencimiento);
      return dueDate < today && i.estado === 'Enviada';
    });
    return of(invoices);
  }

  // Quotes
  getQuotes(): Observable<Quote[]> {
    return this.quotes$.asObservable();
  }

  getQuoteById(id: number): Observable<Quote> {
    const quotes = this.quotes$.value;
    const quote = quotes.find(q => q.id === id);
    if (quote) {
      return of(quote);
    }
    throw new Error('Quote not found');
  }

  createQuote(quote: Quote): Observable<Quote> {
    const quotes = this.quotes$.value;
    const newQuote = { ...quote, id: this.generateId(quotes) };
    quotes.push(newQuote);
    this.saveQuotes(quotes);
    return of(newQuote);
  }

  updateQuote(id: number, quote: Quote): Observable<Quote> {
    const quotes = this.quotes$.value;
    const index = quotes.findIndex(q => q.id === id);
    if (index !== -1) {
      quotes[index] = { ...quote, id };
      this.saveQuotes(quotes);
      return of(quotes[index]);
    }
    throw new Error('Quote not found');
  }

  deleteQuote(id: number): Observable<void> {
    const quotes = this.quotes$.value.filter(q => q.id !== id);
    this.saveQuotes(quotes);
    return of(void 0);
  }

  updateQuoteStatus(id: number, estado: Quote['estado']): Observable<Quote> {
    const quotes = this.quotes$.value;
    const index = quotes.findIndex(q => q.id === id);
    if (index !== -1) {
      quotes[index].estado = estado;
      this.saveQuotes(quotes);
      return of(quotes[index]);
    }
    throw new Error('Quote not found');
  }

  convertQuoteToInvoice(quoteId: number): Observable<Invoice> {
    const quotes = this.quotes$.value;
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const invoice: Invoice = {
        id: 0,
        numeroFactura: `FAC-${new Date().getFullYear()}-${String(this.generateId(this.invoices$.value) + 1).padStart(3, '0')}`,
        clienteId: quote.clienteId,
        clienteNombre: quote.clienteNombre,
        ordenReparacionId: quote.ordenReparacionId,
        numeroOrden: quote.numeroOrden,
        fechaEmision: new Date(),
        fechaVencimiento: quote.fechaValidoHasta,
        estado: 'Enviada',
        subtotal: quote.subtotal,
        impuestos: quote.impuestos,
        descuento: quote.descuento,
        total: quote.total,
        items: quote.items.map(item => ({
          id: item.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
          tipo: item.tipo
        })),
        pagos: []
      };
      return this.createInvoice(invoice);
    }
    throw new Error('Quote not found');
  }

  getQuotesByCustomer(customerId: number): Observable<Quote[]> {
    const quotes = this.quotes$.value.filter(q => q.clienteId === customerId);
    return of(quotes);
  }

  private generateId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }
}
