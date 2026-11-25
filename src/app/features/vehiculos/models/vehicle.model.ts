import { Vehicle } from '../../cliente/models/customer.model';
import { RepairOrder } from '../../orden-reparacion/models/order.model';

export interface VehicleWithOwner extends Vehicle {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderCount?: number;
}

export interface VehicleProcedure {
  order: RepairOrder;
  parts: { nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[];
  labor: { descripcion: string; horas: number; subtotal: number }[];
  total: number;
}
