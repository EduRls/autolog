import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly user$;

  constructor(private auth: Auth) {
    this.user$ = authState(this.auth);
  }

  // Login de usuario
  async login({ email, password }: { email: string; password: string }) {
    try {
      const user = await this.loginWithEmailPassword({ email, password });
      return user;
    } catch {
      return null;
    }
  }

  loginWithEmailPassword({ email, password }: { email: string; password: string }) {
    return signInWithEmailAndPassword(this.auth, email.trim().toLowerCase(), password);
  }

  sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email.trim().toLowerCase());
  }

  // Logout de usuario
  logout() {
    return signOut(this.auth);
  }
}
