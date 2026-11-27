export interface Customer {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  fechaRegistro: Date;
  notas?: string;
  lealtadPuntos: number;
  nivelLealtad: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
  estado: 'Activo' | 'Inactivo';
  vehiculos?: Vehicle[];
  historialComunicaciones?: Communication[];
  documentos?: Document[];
  version?: number;
  lastModified?: Date;
}

export interface Document {
  id?: number;
  filename: string;
  originalName: string;
  url: string;
  uploadDate: Date;
  tipo: string;
}

export interface VehicleMaintenance {
  id?: number;
  tipo: 'Aceite' | 'Filtro de aceite' | 'Filtro de aire' | 'Filtro de habitáculo' | 'Pastillas de freno' | 'Neumáticos' | 'Otro';
  fecha: Date | string;
  kilometraje: number;
  proximoCambioKm?: number;
  proximoCambioFecha?: Date | string;
  notas?: string;
}

export interface Vehicle {
  id?: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  vin?: string;
  color: string;
  kilometraje: number;
  clienteId: number;
  mantenimientos?: VehicleMaintenance[];
}

export interface Communication {
  id?: number;
  tipo: 'Llamada' | 'Email' | 'SMS' | 'WhatsApp';
  fecha: Date;
  asunto: string;
  mensaje: string;
  clienteId: number;
}
