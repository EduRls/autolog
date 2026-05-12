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
export class IncidentesService {

  constructor(
      private firestore: Firestore
    ) { }
  
    getVentas(): Observable<any[]> {
      const registroRef = collection(this.firestore, 'venta_sospechosa');
      return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
    }
  
    getVentaById(id: string): Observable<any> {
      const registroRef = doc(this.firestore, `venta_sospechosa/${id}`);
      return docData(registroRef) as Observable<any>;
    }
  
    addVenta(reporte: any): Promise<any> {
      return addDoc(collection(this.firestore, 'venta_sospechosa'), reporte);
    }
  
    deleteVenta(id: string) {
      const registroRef = doc(this.firestore, `venta_sospechosa/${id}`);
      return deleteDoc(registroRef);
    }
  
    updateVenta(reporte: any): Promise<any> {
      const registroRef = doc(this.firestore, `venta_sospechosa/${reporte.id}`);
      return updateDoc(registroRef, {
        DOMICILIO: reporte.DOMICILIO,
        FECHA_VENTA: reporte.FECHA_VENTA,
        ID_CILINDRO: reporte.ID_CILINDRO,
        ID_VENDEDOR: reporte.ID_VENDEDOR
      });
    }
}
