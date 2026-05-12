import { Injectable } from '@angular/core';
import {
  doc,
  collection,
  collectionData,
  docData,
  Firestore,
  updateDoc
} from '@angular/fire/firestore';
import {
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DistribuidoresService {

  constructor(
    private firestore: Firestore
  ) { }

  getDistribuidores(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'distribuidores');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  getAsignacionesVentas(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'asignacion_diaria');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  getDistribuidorById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `distribuidores/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  addDistribuidor(reporte: any): Promise<any> {
    return addDoc(collection(this.firestore, 'distribuidores'), reporte);
  }

  deleteDistribuidor(id: string) {
    const registroRef = doc(this.firestore, `distribuidores/${id}`);
    return deleteDoc(registroRef);
  }

  updateDistribuidor(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `distribuidores/${reporte.id}`);
    return updateDoc(registroRef, {
      identificador: reporte.identificador,
      nombre: reporte.nombre,
      ruta: reporte.ruta,
      zona: reporte.zona
    });
  }
}
