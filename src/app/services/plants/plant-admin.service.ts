import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Firestore, collection, collectionData, getDocs, limit, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Planta } from '../../models/planta.model';

export interface PlantPayload {
  nombre: string;
  clave: string;
  descripcion: string;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlantAdminService {
  constructor(private readonly firestore: Firestore, private readonly functions: Functions) {}

  list(): Observable<Planta[]> {
    return collectionData(collection(this.firestore, 'plantas'), { idField: 'id' }) as Observable<Planta[]>;
  }

  async create(payload: PlantPayload): Promise<string> {
    const callable = httpsCallable<PlantPayload, { id: string }>(this.functions, 'createPlant');
    return (await callable({ nombre: payload.nombre, clave: payload.clave, descripcion: payload.descripcion })).data.id;
  }

  async update(id: string, payload: PlantPayload): Promise<void> {
    const callable = httpsCallable<PlantPayload & { id: string; activo: boolean }, { id: string }>(this.functions, 'updatePlant');
    await callable({ id, nombre: payload.nombre, clave: payload.clave, descripcion: payload.descripcion, activo: payload.activo !== false });
  }

  async hasActiveUsers(id: string): Promise<boolean> {
    const snapshot = await getDocs(query(
      collection(this.firestore, 'usuarios'),
      where('plantaIdPrincipal', '==', id),
      where('activo', '==', true),
      limit(1)
    ));
    return !snapshot.empty;
  }
}
