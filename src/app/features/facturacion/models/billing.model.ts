export interface Invoice {
  id?: number;
  numeroFactura: string;
  clienteId: number;
  clienteNombre: string;
  ordenReparacionId?: number;
  numeroOrden?: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  fechaPago?: Date;
  estado: 'Borrador' | 'Enviada' | 'Pagada' | 'Vencida' | 'Cancelada';
  subtotal: number;
  impuestos: number;
  descuento: number;
  total: number;
  metodoPago?: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque';
  notas?: string;
  items: InvoiceItem[];
  pagos: InvoicePayment[];
}

export interface InvoiceItem {
  id?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  tipo: 'Parte' | 'Labor' | 'Servicio';
}

export interface InvoicePayment {
  id?: number;
  monto: number;
  metodo: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque';
  fecha: Date;
  referencia?: string;
  notas?: string;
}

export interface Quote {
  id?: number;
  numeroCotizacion: string;
  clienteId: number;
  clienteNombre: string;
  ordenReparacionId?: number;
  numeroOrden?: string;
  fechaEmision: Date;
  fechaValidoHasta: Date;
  estado: 'Borrador' | 'Enviada' | 'Aceptada' | 'Rechazada' | 'Expirada';
  subtotal: number;
  impuestos: number;
  descuento: number;
  total: number;
  notas?: string;
  items: QuoteItem[];
}

export interface QuoteItem {
  id?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  tipo: 'Parte' | 'Labor' | 'Servicio';
}
