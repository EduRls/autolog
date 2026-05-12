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
export class CilindrosService {

  constructor(
    private firestore: Firestore
  ) { }


  getInventarioOperador(): Observable<any[]> {
      const registroRef = collection(this.firestore, 'asignacion_diaria');
      return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
    }
}
