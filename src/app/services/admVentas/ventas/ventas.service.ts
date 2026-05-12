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
  setDoc,
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
export class VentasService {

  constructor(
    private firestore: Firestore
  ) { }

  getVentas(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'ventas_sms');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  getVentaById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `ventas_sms/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  addVenta(reporte: any): Promise<any> {
    return addDoc(collection(this.firestore, 'ventas_sms'), reporte);
  }

  deleteVenta(id: string) {
    const registroRef = doc(this.firestore, `ventas_sms/${id}`);
    return deleteDoc(registroRef);
  }

  updateVenta(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `ventas_sms/${reporte.id}`);
    return updateDoc(registroRef, {
      DOMICILIO: reporte.DOMICILIO,
      FECHA_VENTA: reporte.FECHA_VENTA,
      ID_CILINDRO: reporte.ID_CILINDRO,
      ID_VENDEDOR: reporte.ID_VENDEDOR
    });
  }

  /*
    Establecer las ventas
  */
  // 1. Guardar en histórico
  addPrecioHistorico(precio: any): Promise<any> {
    const ref = collection(this.firestore, 'precio_historico');
    return addDoc(ref, {
      ...precio,
      fecha: new Date().toISOString()
    });
  }

  // 2. Crear el doc "activo" si no existe
  async agregarPrecioSiNoExiste(precio: any): Promise<void> {
    const docRef = doc(this.firestore, 'precio_activo/activo');
    const snapshot = await getDocs(collection(this.firestore, 'precio_activo'));

    // Aquí asumimos que solo existirá "activo"
    const existe = snapshot.docs.some((d) => d.id === 'activo');

    if (!existe) {
      await updateDoc(docRef, {
        ...precio,
        actualizado: new Date().toISOString()
      }).catch(async () => {
        // Si no existe, lo creamos con set
        await setDoc(docRef, {
          ...precio,
          actualizado: new Date().toISOString()
        });
      });
    } else {
      console.log('Ya existe el precio activo');
    }
  }

  // 3. Actualizar el precio dentro de doc "activo"
  async actualizarPrecioActivo(precio: any, zona:any): Promise<void> {
    const docRef = doc(this.firestore, `precio_activo/activo_${zona}`);
    await setDoc(docRef, {
      ...precio,
      actualizado: new Date().toISOString()
    });
  }

  // 4. Obtener el precio activo
  async obtenerPrecioActivo(): Promise<any | null> {
    const docRef = doc(this.firestore, 'precio_activo/activo');
    const snap = await getDocs(collection(this.firestore, 'precio_activo'));
    const encontrado = snap.docs.find(d => d.id === 'activo');
    return encontrado ? encontrado.data() : null;
  }


  getPrecioZonas(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'precio_activo');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }

  // 5. Saber si el doc "activo" existe
  async existePrecioActivo(): Promise<boolean> {
    const docRef = doc(this.firestore, 'precio_activo/activo');
    const snap = await getDocs(collection(this.firestore, 'precio_activo'));
    return snap.docs.some((d) => d.id === 'activo');
  }



}
