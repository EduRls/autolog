import { Timestamp } from '@angular/fire/firestore';

export interface PlantaDocument {
  nombre: string;
  clave: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: Timestamp;
  createdByUid?: string;
  updatedAt?: Timestamp;
  updatedByUid?: string;
}

export interface Planta extends PlantaDocument {
  id: string;
}
