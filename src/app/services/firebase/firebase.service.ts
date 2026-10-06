import { Injectable } from '@angular/core';
import {
  doc,
  collection,
  collectionData,
  docData,
  Firestore,
  updateDoc,
  serverTimestamp,
  runTransaction
} from '@angular/fire/firestore';
import {
  deleteDoc,
  addDoc,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { Observable, distinctUntilChanged, filter, from, map, switchMap } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { PlantScopeService } from '../plants/plant-scope.service';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private firestore: Firestore,
    private readonly auth: Auth,
    private readonly plantScope: PlantScopeService
  ) { }

  async getUserByEmail(email: string) {
    const usersRef = collection(this.firestore, 'usuarios');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0]; // Retorna el primer resultado
    } else {
      return null; // No se encontró el usuario
    }
  }

  async getUserProfile(uid: string, email: string) {
    const userByUid = await getDoc(doc(this.firestore, `usuarios/${uid}`));

    if (userByUid.exists()) {
      return userByUid;
    }

    return this.getUserByEmail(email);
  }


  /*
      A D M I N I S T R A C I Ó N    D E     E V E N T O S
  */
  getEvento(): Observable<any[]> {
    return this.scopedCollection('eventos', 'plantaId');
  }

  getEventoById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `eventos/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  addEvento(reporte: any): Promise<any> {
    return this.createEventAndUpdateAuto(reporte);
  }

  deleteEvento(id: string) {
    const registroRef = doc(this.firestore, `eventos/${id}`);
    return deleteDoc(registroRef);
  }

  updateEvento(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `eventos/${reporte.id}`);
    return updateDoc(registroRef, {
      unidad: reporte.unidad,
      kilometraje: Number(reporte.kilometraje),
      servicio: reporte.servicio,
      articulos: this.normalizeEventArticles(reporte.articulos),
      costo: Number(reporte.costo),
      fecha: reporte.fecha,
      autUser: reporte.autUser, // Usuario que autorizó la operación
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.currentUser?.uid || null
    });
  }


  /*
      A D M I N I S T R A C I O N       D E     A U T O S
  */

  getAutos(): Observable<any[]> {
    return this.scopedCollection('autos', 'plantaId');
  }

  getAutoById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `autos/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  async addAuto(reporte: any): Promise<any> {
    await this.plantScope.initialize();
    const plantaId = this.plantScope.resolveWritePlantId(reporte.plantaId);
    const operadorIds = this.normalizeOperatorIds(reporte);
    const unidad = typeof reporte.unidad === 'string' ? reporte.unidad.trim() : '';
    if (!unidad) throw new Error('AUTO_NUMBER_REQUIRED');
    const autoRef = doc(collection(this.firestore, 'autos'));
    const distributorRefs = operadorIds.map(id => doc(this.firestore, `distribuidores/${id}`));
    const uid = this.auth.currentUser?.uid || null;
    await runTransaction(this.firestore, async transaction => {
      const distributors = [];
      for (const distributorRef of distributorRefs) {
        distributors.push(await transaction.get(distributorRef));
      }
      for (const distributor of distributors) {
        if (!distributor.exists()) throw new Error('DISTRIBUTOR_NOT_FOUND');
        const data = distributor.data() as any;
        if (data.plantaIdPrincipal !== plantaId || data.activo === false) {
          throw new Error('DISTRIBUTOR_PLANT_MISMATCH');
        }
      }
      const operadores = distributors.map(item => String(item.data()?.['nombre'] || ''));
      transaction.set(autoRef, {
        unidad,
        operadorId: operadorIds[0],
        operador: operadores[0],
        operadorIds,
        operadores,
        kilometraje: Number(reporte.kilometraje),
        km_actual: Number(reporte.km_actual),
        km_proximo_servicio: Number(reporte.km_proximo_servicio),
        desc: reporte.desc,
        plantaId,
        createdAt: serverTimestamp(),
        createdByUid: uid,
        updatedAt: serverTimestamp(),
        updatedByUid: uid
      });
      for (const distributorRef of distributorRefs) {
        transaction.update(distributorRef, {
          ruta: unidad,
          updatedAt: serverTimestamp(),
          updatedByUid: uid
        });
      }
    });
    return autoRef;
  }

  deleteAuto(id: string) {
    const registroRef = doc(this.firestore, `autos/${id}`);
    return deleteDoc(registroRef);
  }

  async updateAuto(reporte: any): Promise<any> {
    await this.plantScope.initialize();
    const registroRef = doc(this.firestore, `autos/${reporte.id}`);
    const operadorIds = this.normalizeOperatorIds(reporte);
    const unidad = typeof reporte.unidad === 'string' ? reporte.unidad.trim() : '';
    if (!unidad) throw new Error('AUTO_NUMBER_REQUIRED');
    const uid = this.auth.currentUser?.uid || null;
    return runTransaction(this.firestore, async transaction => {
      const currentAuto = await transaction.get(registroRef);
      if (!currentAuto.exists()) throw new Error('AUTO_NOT_FOUND');
      const currentData = currentAuto.data() as any;
      const plantaId = currentData.plantaId;
      if (!plantaId || !this.plantScope.canWritePlant(plantaId)) throw new Error('PLANT_WRITE_DENIED');
      const previousIds = this.normalizeOperatorIds(currentData);
      const allIds = [...new Set([...operadorIds, ...previousIds])];
      const distributorRefs = allIds.map(id => doc(this.firestore, `distribuidores/${id}`));
      const distributors = [];
      for (const distributorRef of distributorRefs) {
        distributors.push(await transaction.get(distributorRef));
      }
      const distributorById = new Map(distributors.map(item => [item.id, item]));
      const selected = operadorIds.map(id => distributorById.get(id));
      for (const distributor of selected) {
        if (!distributor?.exists()) throw new Error('DISTRIBUTOR_NOT_FOUND');
        const data = distributor.data() as any;
        if (data.plantaIdPrincipal !== plantaId || data.activo === false) {
          throw new Error('DISTRIBUTOR_PLANT_MISMATCH');
        }
      }
      const operadores = selected.map(item => String(item?.data()?.['nombre'] || ''));
      transaction.update(registroRef, {
        unidad,
        operador: operadores[0],
        operadorId: operadorIds[0],
        operadorIds,
        operadores,
        kilometraje: Number(reporte.kilometraje),
        km_actual: Number(reporte.km_actual),
        km_proximo_servicio: Number(reporte.km_proximo_servicio),
        desc: reporte.desc,
        updatedAt: serverTimestamp(),
        updatedByUid: uid
      });
      for (const distributorId of operadorIds) {
        transaction.update(distributorById.get(distributorId)!.ref, {
          ruta: unidad, updatedAt: serverTimestamp(), updatedByUid: uid
        });
      }
      for (const distributorId of previousIds.filter(id => !operadorIds.includes(id))) {
        const distributor = distributorById.get(distributorId);
        if (distributor?.exists() && distributor.data()?.['ruta'] === currentData.unidad) {
          transaction.update(distributor.ref, {
            ruta: '', updatedAt: serverTimestamp(), updatedByUid: uid
          });
        }
      }
    });
  }

  private normalizeOperatorIds(reporte: any): string[] {
    const rawIds = Array.isArray(reporte?.operadorIds)
      ? reporte.operadorIds
      : [reporte?.operadorId];
    const ids: string[] = Array.from(new Set<string>((rawIds as unknown[])
      .filter((id: unknown): id is string => typeof id === 'string')
      .map((id: string) => id.trim())
      .filter(Boolean)));
    if (!ids.length || ids.length > 9) throw new Error('AUTO_OPERATORS_REQUIRED');
    return ids;
  }


  /*

  A D M I N I S T R A C I Ó N     D E     A R T Í C U L O S

  */

  getArticulos(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'articulos');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  getArticuloById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `articulos/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  async addArticulo(reporte: any): Promise<any> {
    await this.plantScope.initialize();
    const activePlantId = this.plantScope.getActivePlantId();
    const plantaId = activePlantId || !this.plantScope.isGlobal()
      ? this.plantScope.resolveWritePlantId(activePlantId)
      : null;
    return addDoc(collection(this.firestore, 'articulos'), {
      ...reporte,
      ...(plantaId ? { plantaId } : {}),
      createdAt: serverTimestamp(),
      createdByUid: this.auth.currentUser?.uid || null,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.currentUser?.uid || null
    });
  }

  deleteArticulo(id: string) {
    const registroRef = doc(this.firestore, `articulos/${id}`);
    return deleteDoc(registroRef);
  }

  updateArticulo(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `articulos/${reporte.id}`);
    return updateDoc(registroRef, {
      articulo: reporte.articulo,
      precio: reporte.precio,
      desc: reporte.desc,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.currentUser?.uid || null
    });
  }

  /*
    Obtener distribuidores
  */

  getDistribuidores(): Observable<any[]> {
    return this.scopedCollection('distribuidores', 'plantaIdPrincipal');
  }

  async createEventAndUpdateAuto(reporte: any): Promise<string> {
    await this.plantScope.initialize();
    const autoId = typeof reporte?.unidad?.id === 'string' ? reporte.unidad.id : reporte?.unidad;
    if (!autoId) throw new Error('AUTO_REQUIRED');
    const kilometraje = Number(reporte.kilometraje);
    const costo = Number(reporte.costo);
    if (!Number.isFinite(kilometraje) || kilometraje < 0) throw new Error('INVALID_MILEAGE');
    if (!Number.isFinite(costo) || costo < 0) throw new Error('INVALID_COST');
    const articulos = this.normalizeEventArticles(reporte.articulos);
    const autoRef = doc(this.firestore, `autos/${autoId}`);
    const eventRef = doc(collection(this.firestore, 'eventos'));
    await runTransaction(this.firestore, async transaction => {
      const auto = await transaction.get(autoRef);
      if (!auto.exists()) throw new Error('AUTO_NOT_FOUND');
      const autoData = auto.data() as any;
      const plantaId = autoData.plantaId;
      if (!plantaId || !this.plantScope.canWritePlant(plantaId)) throw new Error('PLANT_WRITE_DENIED');
      const uid = this.auth.currentUser?.uid || null;
      transaction.set(eventRef, {
        ...reporte,
        kilometraje,
        costo,
        articulos,
        unidad: { id: auto.id, unidad: autoData.unidad },
        plantaId,
        createdAt: serverTimestamp(), createdByUid: uid,
        updatedAt: serverTimestamp(), updatedByUid: uid
      });
      transaction.update(autoRef, {
        km_actual: kilometraje,
        km_proximo_servicio: kilometraje + 10000,
        updatedAt: serverTimestamp(), updatedByUid: uid
      });
    });
    return eventRef.id;
  }

  private normalizeEventArticles(articulos: unknown): any[] {
    if (!Array.isArray(articulos)) return [];
    return articulos.map((articulo: any) => ({
      nombre: String(articulo?.nombre || '').trim(),
      precio: Number(articulo?.precio),
      cantidad: Number(articulo?.cantidad),
      proveedor: String(articulo?.proveedor || '').trim()
    }));
  }

  private scopedCollection(collectionName: string, plantField: string): Observable<any[]> {
    return from(this.plantScope.initialize()).pipe(
      switchMap(() => this.plantScope.state$),
      filter(state => state.ready && Boolean(state.profile)),
      map(state => state.activePlantId),
      distinctUntilChanged(),
      switchMap(plantId => {
        const reference = collection(this.firestore, collectionName);
        if (plantId) {
          return collectionData(query(reference, where(plantField, '==', plantId)), { idField: 'id' }) as Observable<any[]>;
        }
        if (!this.plantScope.isGlobal()) throw new Error('PLANT_CONTEXT_REQUIRED');
        return collectionData(reference, { idField: 'id' }) as Observable<any[]>;
      })
    );
  }

}
