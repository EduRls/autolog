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
export class MonitoreogasmakeService {

  constructor(
    private firestore: Firestore
  ) { }

  getUsuarios(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'ventas_sms');
    return collectionData(registroRef, { idField: 'id' }) as Observable<any[]>;
  }



}
