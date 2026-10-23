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
}

export interface Communication {
  id?: number;
  tipo: 'Llamada' | 'Email' | 'SMS' | 'WhatsApp';
  fecha: Date;
  asunto: string;
  mensaje: string;
  clienteId: number;
}
