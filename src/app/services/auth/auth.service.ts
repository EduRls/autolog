import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  setDoc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // Registro de usuario y almacenamiento en Firestore
  async register({ email, password, usuario, rol }: { email: string; password: string; usuario: string; rol: string }) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const user = userCredential.user;

      // Guardar datos adicionales del usuario en Firestore
      await setDoc(doc(this.firestore, 'usuarios', user.uid), {
        email: user.email,
        usuario,
        rol,
      });

      return user;
    } catch (e) {
      console.error('Error al registrar usuario:', e);
      return null;
    }
  }

  // Login de usuario
  async login({ email, password }: { email: string; password: string }) {
    try {
      const user = await signInWithEmailAndPassword(this.auth, email, password);
      return user;
    } catch (e) {
      console.error('Error al iniciar sesión:', e);
      return null;
    }
  }

  // Logout de usuario
  logout() {
    return signOut(this.auth);
  }
  

  // Actualizar usuario en Firestore
  async updateUser(uid: string, { usuario, rol }: { usuario: string; rol: string }) {
    try {
      const userDocRef = doc(this.firestore, 'usuarios', uid);

      await updateDoc(userDocRef, {
        usuario,
        rol,
      });

      console.log('Usuario actualizado correctamente');
    } catch (e) {
      console.error('Error al actualizar usuario:', e);
    }
  }
}