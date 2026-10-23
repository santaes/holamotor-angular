export interface RepairOrder {
  id?: number;
  numeroOrden: string;
  clienteId: number;
  clienteNombre?: string;
  vehiculoId: number;
  vehiculoInfo?: string;
  fechaIngreso: Date;
  fechaEstimadaSalida?: Date;
  fechaSalida?: Date;
  estado: 'Pendiente' | 'En Progreso' | 'Esperando Partes' | 'Listo' | 'Entregado' | 'Cancelado';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  mecanicoAsignado?: number;
  mecanicoNombre?: string;
  descripcionProblema: string;
  diagnostico?: string;
  trabajoRealizado?: string;
  costoEstimado: number;
  costoFinal?: number;
  aprobadoPorCliente: boolean;
  aprobadoPorClienteFecha?: Date;
  observaciones?: string;
  partesUsadas?: OrderPart[];
  labor?: OrderLabor[];
  pagos?: Payment[];
}

export interface OrderPart {
  id?: number;
  parteId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrderLabor {
  id?: number;
  mecanicoId: number;
  mecanicoNombre: string;
  descripcion: string;
  horas: number;
  tarifaPorHora: number;
  subtotal: number;
  fecha: Date;
}

export interface Payment {
  id?: number;
  monto: number;
  metodo: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque';
  fecha: Date;
  referencia?: string;
}
