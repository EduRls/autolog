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
  query,
  where,
  getDocs
} from 'firebase/firestore';
import {
  Auth
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentasMalasService {

  constructor(
    private firestore: Firestore
  ) { }

  getVentas(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'venta_dia_sospechosa_sms');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  getVentaById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `venta_dia_sospechosa_sms/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  addVenta(reporte: any): Promise<any> {
    return addDoc(collection(this.firestore, 'venta_dia_sospechosa_sms'), reporte);
  }

  deleteVenta(id: string) {
    const registroRef = doc(this.firestore, `venta_dia_sospechosa_sms/${id}`);
    return deleteDoc(registroRef);
  }

  updateVenta(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `venta_dia_sospechosa_sms/${reporte.id}`);
    return updateDoc(registroRef, {
      DOMICILIO: reporte.DOMICILIO,
      FECHA_VENTA: reporte.FECHA_VENTA,
      ID_CILINDRO: reporte.ID_CILINDRO,
      ID_VENDEDOR: reporte.ID_VENDEDOR
    });
  }
}
