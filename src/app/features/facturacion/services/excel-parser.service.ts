import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';
import { Invoice, InvoiceItem } from '../models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelParserService {

  constructor() {}

  /**
   * Parse an Excel file (matching the "Factura Hola Motor.xlsx" template)
   * and convert it to an Invoice object
   */
  parseInvoiceFromExcel(file: File): Promise<Invoice> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e: any) => {
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(e.target.result);
          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            reject(new Error('Excel file has no worksheets'));
            return;
          }
          const jsonData = this.sheetToArray(worksheet);
          const invoice = this.extractInvoiceData(jsonData);
          resolve(invoice);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Convert a worksheet to an array of arrays (like sheet_to_json with header:1, defval:null)
   */
  private sheetToArray(worksheet: ExcelJS.Worksheet): any[][] {
    const rows: any[][] = [];
    const colCount = worksheet.columnCount;

    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values: any[] = [];
      for (let c = 1; c <= colCount; c++) {
        values.push(this.cellValue(row.getCell(c)));
      }
      rows.push(values);
    });

    return rows;
  }

  /**
   * Extract the primitive value from an ExcelJS cell (unwraps formulas, rich text, hyperlinks)
   */
  private cellValue(cell: ExcelJS.Cell): any {
    const v = cell.value;
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v;
    if (typeof v === 'object') {
      const obj = v as any;
      if ('result' in obj) return this.unwrapValue(obj.result);
      if ('richText' in obj) return obj.richText.map((r: any) => r.text).join('');
      if ('text' in obj) return obj.text;
      if ('error' in obj) return null;
    }
    return v;
  }

  private unwrapValue(v: any): any {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v;
    if (typeof v === 'object') {
      if ('richText' in v) return v.richText.map((r: any) => r.text).join('');
      if ('text' in v) return v.text;
      if ('result' in v) return this.unwrapValue(v.result);
    }
    return v;
  }

  /**
   * Extract invoice data from the Excel row data
   * Based on the template structure:
   * - Row 1: Company info/logo
   * - Row 5: FACTURA header
   * - Row 7: FACTURAR A, FACTURA Nº
   * - Row 8: Client name, FECHA
   * - Row 9: ID/Passport
   * - Row 10: Address
   * - Row 11: City/Country
   * - Row 13: DESCRIPCION, Unidades, Precio Unitario, Precio
   * - Row 14+: Items
   * - Row 19: SUBTOTAL
   * - Row 22: TOTAL
   * - Row 27: Forma de pago
   * - Row 28: Bank account
   */
  private extractInvoiceData(rows: any[][]): Invoice {
    const items: InvoiceItem[] = [];
    let subtotal = 0;
    let total = 0;
    let metodoPago: Invoice['metodoPago'] = 'Efectivo';

    // Extract invoice number (row 7, column 3 - "Номер фактруы")
    const invoiceNumber = rows[6]?.[3] || `FAC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Extract date (row 8, column 3 - "Дата фактуры")
    const dateValue = rows[7]?.[3];
    const fechaEmision = this.parseDate(dateValue) || new Date();

    // Extract client name (row 8, column 0 - "Имя клиента")
    const clienteNombre = rows[7]?.[0] || 'Cliente sin nombre';

    // Extract client ID (row 9, column 0 - "НИЕ или Паспорт")
    const clienteId = this.extractClientId(rows[8]?.[0]);

    // Extract address (row 10, column 0 - "Адрес")
    const address = rows[9]?.[0] || '';

    // Extract city/country (row 11, column 0 - "Город страна")
    const cityCountry = rows[10]?.[0] || '';

    // Extract items (starting from row 14)
    for (let i = 13; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const descripcion = row[0];
      const cantidad = row[1];
      const precioUnitario = row[2];
      const precio = row[3];

      // Skip if it's a header or empty row
      if (descripcion === 'DESCRIPCION' || !descripcion) continue;

      // Stop if we hit the totals section
      if (descripcion === 'SUBTOTAL' || descripcion === 'TOTAL') break;

      const item: InvoiceItem = {
        descripcion: String(descripcion),
        cantidad: cantidad || 1,
        precioUnitario: precioUnitario || precio || 0,
        subtotal: precio || (cantidad * precioUnitario) || 0,
        tipo: 'Servicio' // Default to service for this template
      };

      items.push(item);
    }

    // Calculate subtotal from items
    subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Extract subtotal from Excel (row 19, column 3)
    const excelSubtotal = rows[18]?.[3];
    if (excelSubtotal && typeof excelSubtotal === 'number') {
      subtotal = excelSubtotal;
    }

    // Extract total from Excel (row 22, column 2 - "=SUM(D19,D20)+D15")
    const excelTotal = rows[21]?.[2];
    if (excelTotal && typeof excelTotal === 'number') {
      total = excelTotal;
    } else {
      total = subtotal; // Fallback to subtotal if no tax/discount
    }

    // Extract payment method (row 27, column 0 - "Forma de pago")
    const paymentMethod = rows[26]?.[0];
    if (paymentMethod) {
      metodoPago = this.parsePaymentMethod(paymentMethod);
    }

    // Calculate taxes and discount (default to 0 for this template)
    const impuestos = 0;
    const descuento = 0;

    // Calculate due date (30 days from emission)
    const fechaVencimiento = new Date(this.ensureDate(fechaEmision));
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    const invoice: Invoice = {
      numeroFactura: String(invoiceNumber),
      clienteId,
      clienteNombre,
      fechaEmision,
      fechaVencimiento,
      estado: 'Borrador',
      subtotal,
      impuestos,
      descuento,
      total,
      metodoPago,
      notas: `Dirección: ${address}, ${cityCountry}`,
      items,
      pagos: []
    };

    return invoice;
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === 'number') {
      // Excel date format (days since 1900)
      return new Date((value - 25569) * 86400 * 1000);
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  }

  private ensureDate(value: Date | string): Date {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value;
  }

  private extractClientId(value: any): number {
    if (!value) return 1;

    if (typeof value === 'number') return value;

    if (typeof value === 'string') {
      const num = parseInt(value.replace(/\D/g, ''));
      return isNaN(num) ? 1 : num;
    }

    return 1;
  }

  private parsePaymentMethod(value: string): Invoice['metodoPago'] {
    const normalized = value.toLowerCase();

    if (normalized.includes('efectivo') || normalized.includes('cash')) {
      return 'Efectivo';
    }
    if (normalized.includes('tarjeta') || normalized.includes('card')) {
      return 'Tarjeta';
    }
    if (normalized.includes('transferencia') || normalized.includes('transfer')) {
      return 'Transferencia';
    }
    if (normalized.includes('cheque')) {
      return 'Cheque';
    }

    return 'Efectivo';
  }

  /**
   * Export an Invoice to Excel format matching the template
   */
  exportInvoiceToExcel(invoice: Invoice): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('REBU');
    const worksheetData = this.buildExcelData(invoice);

    worksheetData.forEach(row => worksheet.addRow(row));

    return workbook;
  }

  private buildExcelData(invoice: Invoice): any[][] {
    const data: any[][] = [];

    // Header
    data.push(['HOLAMOTOR S.L.U.', null, 'CIF B05727524']);
    data.push(['C/Barranquet 3 bj 2, Villajoyosa, 03570', null, null]);
    data.push(['Tel: 865741988', null, null]);
    data.push([null, null, null]);

    // FACTURA header
    data.push([null, 'FACTURA', null, null]);
    data.push([null, null, null, null]);

    // Invoice info
    data.push(['FACTURAR A', null, 'FACTURA Nº', invoice.numeroFactura]);
    data.push([invoice.clienteNombre, null, 'FECHA', this.formatDateForExcel(this.ensureDate(invoice.fechaEmision))]);
    data.push(['ID: ' + invoice.clienteId, null, null, null]);
    data.push([invoice.notas?.split(',')[0] || '', null, null, null]);
    data.push([invoice.notas?.split(',')[1] || '', null, null, null]);

    data.push([null, null, null, null]);

    // Items header
    data.push(['DESCRIPCION', 'Unidades', 'Precio Unitario', 'Precio']);

    // Items
    invoice.items.forEach(item => {
      data.push([item.descripcion, item.cantidad, item.precioUnitario, item.subtotal]);
    });

    // Empty rows
    for (let i = 0; i < 4; i++) {
      data.push([null, null, null, null]);
    }

    // Totals
    data.push(['Firma del Director', null, 'SUBTOTAL', invoice.subtotal]);
    data.push([null, null, null, null]);
    data.push([null, null, null, null]);
    data.push([null, null, 'TOTAL', invoice.total]);

    // Empty rows
    for (let i = 0; i < 4; i++) {
      data.push([null, null, null, null]);
    }

    // Footer
    data.push(['EMPRESA ACOGIDA AL R.E.B.U(regimen de bienes usados) según articulo 135 de la ley 37/1992, de 28 de diciembre del impuesto sobre el valor añadido', null, null, null]);

    // Empty rows
    for (let i = 0; i < 3; i++) {
      data.push([null, null, null, null]);
    }

    // Payment info
    data.push(['Forma de pago: ' + (invoice.metodoPago || 'Efectivo'), null, null, null]);
    data.push(['Número de cuenta bancaria', null, null, null]);
    data.push(['C/Barranquet 3 bj 2, Villajoyosa, 03570', null, null, null]);

    return data;
  }

  private formatDateForExcel(date: Date | string): string {
    if (!date) return '';

    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toISOString().split('T')[0];
  }

  /**
   * Download the workbook as an Excel file
   */
  async downloadExcel(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
