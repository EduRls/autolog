import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from '@angular/fire/firestore';
import { Observable, distinctUntilChanged, filter, from, map, switchMap } from 'rxjs';
import {
  RegistroMedidores,
  RegistroMedidoresPayload,
  SGM_REGISTROS_MEDIDORES_COLLECTION,
  nextConsecutivo,
} from '../../sgm/sgm.models';
import { PlantScopeService } from '../plants/plant-scope.service';

@Injectable({ providedIn: 'root' })
export class SgmMedidoresService {
  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth,
    private readonly plantScope: PlantScopeService
  ) {}

  listRegistros(): Observable<RegistroMedidores[]> {
    return from(this.plantScope.initialize()).pipe(
      switchMap(() => this.plantScope.state$),
      filter(state => state.ready && Boolean(state.profile)),
      map(state => state.activePlantId),
      distinctUntilChanged(),
      switchMap(plantId => {
        const reference = collection(this.firestore, SGM_REGISTROS_MEDIDORES_COLLECTION);
        if (plantId) {
          return collectionData(query(reference, where('plantaId', '==', plantId)), { idField: 'id' }) as Observable<RegistroMedidores[]>;
        }
        if (!this.plantScope.isGlobal()) throw new Error('PLANT_CONTEXT_REQUIRED');
        return collectionData(reference, { idField: 'id' }) as Observable<RegistroMedidores[]>;
      }),
      map(registros => [...registros].sort((a, b) =>
        String(b.fechaRegistro).localeCompare(String(a.fechaRegistro)) || String(b.consecutivo).localeCompare(String(a.consecutivo))))
    );
  }

  /** Consulta los registros de la planta y devuelve el consecutivo que sigue para el año indicado. */
  async getSiguienteConsecutivo(plantaId: string, year: number): Promise<string> {
    const snapshot = await getDocs(query(collection(this.firestore, SGM_REGISTROS_MEDIDORES_COLLECTION), where('plantaId', '==', plantaId)));
    return nextConsecutivo(snapshot.docs.map(item => item.data() as RegistroMedidores), year);
  }

  /** Antes de guardar vuelve a consultar el último consecutivo y asigna el que sigue. */
  async createRegistro(payload: RegistroMedidoresPayload): Promise<{ id: string; consecutivo: string }> {
    await this.plantScope.initialize();
    const plantaId = this.plantScope.resolveWritePlantId(payload.plantaId);
    const uid = this.auth.currentUser?.uid || null;
    const consecutivo = await this.getSiguienteConsecutivo(plantaId, Number(payload.fechaRegistro.slice(0, 4)));
    const reference = await addDoc(collection(this.firestore, SGM_REGISTROS_MEDIDORES_COLLECTION), {
      ...this.clean(payload),
      plantaId,
      consecutivo,
      createdAt: serverTimestamp(),
      createdByUid: uid,
      updatedAt: serverTimestamp(),
      updatedByUid: uid,
    });
    return { id: reference.id, consecutivo };
  }

  /** La planta y el consecutivo no se modifican al editar. */
  async updateRegistro(registro: RegistroMedidores, payload: RegistroMedidoresPayload): Promise<void> {
    await this.plantScope.initialize();
    if (!registro.plantaId || !this.plantScope.canWritePlant(registro.plantaId)) throw new Error('PLANT_WRITE_DENIED');
    await updateDoc(doc(this.firestore, SGM_REGISTROS_MEDIDORES_COLLECTION, registro.id), {
      ...this.clean(payload),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.currentUser?.uid || null,
    });
  }

  async deleteRegistro(registro: RegistroMedidores): Promise<void> {
    await this.plantScope.initialize();
    if (!registro.plantaId || !this.plantScope.canWritePlant(registro.plantaId)) throw new Error('PLANT_WRITE_DENIED');
    await deleteDoc(doc(this.firestore, SGM_REGISTROS_MEDIDORES_COLLECTION, registro.id));
  }

  private clean(payload: RegistroMedidoresPayload) {
    return {
      almacenamiento: payload.almacenamiento.trim(),
      fechaRegistro: payload.fechaRegistro,
      medidores: payload.medidores.map((medidor, index) => ({
        no: index + 1,
        identificacionInterna: medidor.identificacionInterna.trim(),
        descripcion: medidor.descripcion.trim(),
        marca: medidor.marca.trim(),
        modelo: medidor.modelo.trim(),
        numeroSerie: medidor.numeroSerie.trim(),
        localizacion: medidor.localizacion.trim(),
        estadoOperacion: medidor.estadoOperacion,
      })),
      realizo: payload.realizo.trim(),
      aprobo: payload.aprobo.trim(),
      fechaCierre: payload.fechaCierre,
    };
  }
}
