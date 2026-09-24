import { Functions, httpsCallable } from '@angular/fire/functions';
import { Injectable } from '@angular/core';
import {
  doc,
  collection,
  collectionData,
  docData,
  Firestore,
  serverTimestamp,
  updateDoc
} from '@angular/fire/firestore';
import { Observable, distinctUntilChanged, filter, firstValueFrom, from, map, switchMap } from 'rxjs';
import { Distribuidor, isDistribuidorActivo } from '../../../models/distribuidor.model';
import { PlantScopeService } from '../../plants/plant-scope.service';
import { query, where } from 'firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class DistribuidoresService {

  constructor(
    private firestore: Firestore, private readonly functions: Functions,
    private readonly plantScope: PlantScopeService
  ) { }

  getDistribuidores(): Observable<Distribuidor[]> {
    return from(this.plantScope.initialize()).pipe(
      switchMap(() => this.plantScope.state$),
      filter(state => state.ready && Boolean(state.profile)),
      map(state => state.activePlantId),
      distinctUntilChanged(),
      switchMap(plantId => {
        const ref = collection(this.firestore, 'distribuidores');
        if (plantId) return collectionData(query(ref, where('plantaIdPrincipal', '==', plantId)), { idField: 'id' }) as Observable<Distribuidor[]>;
        if (!this.plantScope.isGlobal()) throw new Error('PLANT_CONTEXT_REQUIRED');
        return collectionData(ref, { idField: 'id' }) as Observable<Distribuidor[]>;
      })
    );
  }

  getAsignacionesVentas(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'asignacion_diaria');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  getDistribuidorById(id: string): Observable<Distribuidor | undefined> {
    const registroRef = doc(this.firestore, `distribuidores/${id}`);
    return docData(registroRef, { idField: 'id' }) as Observable<Distribuidor | undefined>;
  }

  async getActivos(): Promise<Distribuidor[]> {
    return (await firstValueFrom(this.getDistribuidores())).filter(isDistribuidorActivo);
  }

  async addDistribuidor(reporte: { nombre: string; ruta: string; zona: string; idempotencyKey: string; plantaId?: string }): Promise<{ id: string; identificador: string }> {
    await this.plantScope.initialize();
    const payload = { ...reporte, plantaId: this.plantScope.resolveWritePlantId(reporte.plantaId) };
    const callable = httpsCallable<typeof payload, { id: string; identificador: string }>(this.functions, 'createDistribuidor');
    return (await callable(payload)).data;
  }

  deleteDistribuidor(id: string) {
    return this.deactivateDistribuidor(id);
  }

  deactivateDistribuidor(id: string): Promise<void> {
    const registroRef = doc(this.firestore, `distribuidores/${id}`);
    return updateDoc(registroRef, { activo: false, updatedAt: serverTimestamp() });
  }

  updateDistribuidor(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `distribuidores/${reporte.id}`);
    return updateDoc(registroRef, {
      nombre: reporte.nombre,
      ruta: reporte.ruta,
      zona: reporte.zona,
      updatedAt: serverTimestamp()
    });
  }
}
