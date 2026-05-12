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
  addDoc,
} from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SorteoService {

  // Colección: registro_sorteo

  constructor(
    private firestore: Firestore
  ) { }

  getDocsSorteos(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'registro_sorteo');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  getSorteoById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `registro_sorteo/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  addSorteo(reporte: any): Promise<any> {
    return addDoc(collection(this.firestore, 'registro_sorteo'), reporte);
  }

  deleteSorteo(id: string) {
    const registroRef = doc(this.firestore, `registro_sorteo/${id}`);
    return deleteDoc(registroRef);
  }

  updateSorteo(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `registro_sorteo/${reporte.id}`);
    return updateDoc(registroRef, {
      DOMICILIO: reporte.DOMICILIO,
      FECHA_VENTA: reporte.FECHA_VENTA,
      ID_CILINDRO: reporte.ID_CILINDRO,
      ID_VENDEDOR: reporte.ID_VENDEDOR
    });
  }
}
