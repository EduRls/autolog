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
      kilometraje: reporte.kilometraje,
      servicio: reporte.servicio,
      articulos: reporte.articulos, // Campo actualizado para incluir el array de artículos
      costo: reporte.costo,
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
    return addDoc(collection(this.firestore, 'autos'), {
      ...reporte,
      plantaId,
      createdAt: serverTimestamp(),
      createdByUid: this.auth.currentUser?.uid || null,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.currentUser?.uid || null
    });
  }

  deleteAuto(id: string) {
    const registroRef = doc(this.firestore, `autos/${id}`);
    return deleteDoc(registroRef);
  }

  updateAuto(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `autos/${reporte.id}`);
    return updateDoc(registroRef, {
      unidad: reporte.unidad,
      operador: reporte.operador,
      operadorId: reporte.operadorId || null,
      kilometraje: reporte.kilometraje,
      km_actual: reporte.km_actual,
      km_proximo_servicio: reporte.km_proximo_servicio,
      desc: reporte.desc,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.currentUser?.uid || null
    });
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

  addArticulo(reporte: any): Promise<any> {
    return addDoc(collection(this.firestore, 'articulos'), reporte);
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
        unidad: { id: auto.id, unidad: autoData.unidad },
        plantaId,
        createdAt: serverTimestamp(), createdByUid: uid,
        updatedAt: serverTimestamp(), updatedByUid: uid
      });
      transaction.update(autoRef, {
        km_actual: reporte.kilometraje,
        km_proximo_servicio: Number(reporte.kilometraje) >= Number(autoData.km_proximo_servicio || 0)
          ? Number(reporte.kilometraje) + 10000 : autoData.km_proximo_servicio,
        updatedAt: serverTimestamp(), updatedByUid: uid
      });
    });
    return eventRef.id;
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
