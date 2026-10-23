export interface InventoryItem {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  cantidad: number;
  cantidadMinima: number;
  cantidadMaxima: number;
  unidadMedida: string;
  precioCompra: number;
  precioVenta: number;
  ubicacion: string;
  proveedorId?: number;
  proveedorNombre?: string;
  fechaUltimaCompra?: Date;
  fechaUltimaVenta?: Date;
  estado: 'Activo' | 'Inactivo';
}

export interface Supplier {
  id?: number;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  tiempoEntregaDias: number;
  notas?: string;
  estado: 'Activo' | 'Inactivo';
}

export interface PurchaseOrder {
  id?: number;
  numeroOrden: string;
  proveedorId: number;
  proveedorNombre: string;
  fechaOrden: Date;
  fechaEntregaEstimada: Date;
  fechaEntregaReal?: Date;
  estado: 'Pendiente' | 'Enviado' | 'Recibido' | 'Cancelado';
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones?: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id?: number;
  inventarioId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  recibido: number;
}
