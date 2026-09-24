import { Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  DocumentData,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from '@angular/fire/firestore';
import { firstValueFrom, take } from 'rxjs';
import { NavigationSectionId, normalizeNavigationSections } from '../../components/menu/navigation.config';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  constructor(
    private readonly auth: Auth,
    private readonly firestore: Firestore
  ) {}

  async isCurrentUserAdmin(): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    return profile ? this.isActiveAdmin(profile) : false;
  }

  async canCurrentUserAccessAutolog(): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    const role = String(profile?.['rol'] || '').trim().toLowerCase();
    const validPlantScope = role !== 'planta' ||
      (typeof profile?.['plantaIdPrincipal'] === 'string' && Boolean(profile['plantaIdPrincipal'].trim()) && profile['accesoTodasPlantas'] !== true);
    return Boolean(profile && profile['activo'] !== false && profile['accesoAutolog'] !== false && ['admin', 'capturista', 'planta'].includes(role) && profile['tipoPersonal'] !== 'DISTRIBUIDOR' && validPlantScope);
  }

  async hasAuthenticatedUser(): Promise<boolean> {
    return Boolean(await firstValueFrom(authState(this.auth).pipe(take(1))));
  }

  async canCurrentUserAccessSection(section: NavigationSectionId): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    if (!profile || profile['activo'] === false || profile['accesoAutolog'] === false) return false;
    const role = String(profile['rol'] || '').trim().toLowerCase();
    return normalizeNavigationSections(role, profile['seccionesMenu']).includes(section);
  }

  private async getCurrentProfile(): Promise<DocumentData | null> {
    const currentUser = await firstValueFrom(authState(this.auth).pipe(take(1)));
    if (!currentUser) return null;

    let profile = await getDoc(doc(this.firestore, `usuarios/${currentUser.uid}`));
    if (!profile.exists() && currentUser.email) {
      const legacyProfiles = await getDocs(query(
        collection(this.firestore, 'usuarios'),
        where('email', '==', currentUser.email),
        limit(1)
      ));
      profile = legacyProfiles.docs[0] ?? profile;
    }

    return profile.exists() ? profile.data() : null;
  }

  private isActiveAdmin(profile: DocumentData): boolean {
    const role = String(profile['rol'] || '').trim().toLowerCase();
    return role === 'admin' && profile['activo'] !== false && profile['accesoAutolog'] !== false && profile['tipoPersonal'] !== 'DISTRIBUIDOR';
  }
}
