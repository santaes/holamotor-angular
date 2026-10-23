export interface Appointment {
  id?: number;
  clienteId: number;
  clienteNombre: string;
  vehiculoId: number;
  vehiculoInfo: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  tipo: 'Mantenimiento' | 'Reparación' | 'Inspección' | 'Diagnóstico' | 'Otro';
  descripcion: string;
  mecanicoId?: number;
  mecanicoNombre?: string;
  estado: 'Programada' | 'Confirmada' | 'En Progreso' | 'Completada' | 'Cancelada' | 'No Asistió';
  prioridad: 'Baja' | 'Media' | 'Alta';
  recordatorioEnviado: boolean;
  notas?: string;
  creadoPor?: string;
  fechaCreacion: Date;
  ordenReparacionId?: number;
}

export interface RecurringAppointment {
  id?: number;
  patron: 'Diario' | 'Semanal' | 'Mensual' | 'Anual';
  intervalo: number;
  fechaInicio: Date;
  fechaFin?: Date;
  diaSemana?: number;
  diaMes?: number;
  appointmentTemplate: Partial<Appointment>;
}
