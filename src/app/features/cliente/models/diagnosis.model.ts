export interface CarDiagnosis {
  id?: number;
  clienteId?: number;
  clienteNombre?: string;
  vehiculoId?: number;
  vehiculoInfo?: string;
  fecha: Date;
  titulo: string;
  pdfFilename: string;
  pdfUrl: string;
  textoOriginal: string;
  textoTraducido?: string;
  idiomaOriginal: string;
  idiomaTraduccion?: string;
  notas?: string;
  mecanicoId?: number;
  mecanicoNombre?: string;
}
