import { Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, firstValueFrom, take } from 'rxjs';
import { Planta } from '../../models/planta.model';
import { UsuarioAutolog, normalizeUsuarioAutolog } from '../../models/usuario-autolog.model';

export interface PlantScopeState {
  ready: boolean;
  profile: UsuarioAutolog | null;
  plants: Planta[];
  activePlantId: string | null;
}

@Injectable({ providedIn: 'root' })
export class PlantScopeService {
  private readonly stateSubject = new BehaviorSubject<PlantScopeState>({
    ready: false, profile: null, plants: [], activePlantId: null
  });
  readonly state$ = this.stateSubject.asObservable();
  private loading?: Promise<void>;
  private readonly storageKey = 'autolog-active-plant-id';

  constructor(private readonly auth: Auth, private readonly firestore: Firestore) {}

  initialize(force = false): Promise<void> {
    if (!force && this.loading) return this.loading;
    this.loading = this.load();
    return this.loading;
  }

  snapshot(): PlantScopeState { return this.stateSubject.value; }
  isGlobal(): boolean { return this.snapshot().profile?.accesoTodasPlantas === true; }
  getPrincipalPlantId(): string | null { return this.snapshot().profile?.plantaIdPrincipal ?? null; }
  getReadablePlantIds(): string[] {
    const profile = this.snapshot().profile;
    if (!profile) return [];
    return [...new Set([...(profile.plantaIdPrincipal ? [profile.plantaIdPrincipal] : []), ...profile.plantasLectura])];
  }
  canReadPlant(plantId: string): boolean { return this.isGlobal() || this.getReadablePlantIds().includes(plantId); }
  canWritePlant(plantId: string): boolean { return this.isGlobal() || this.getPrincipalPlantId() === plantId; }
  getActivePlantId(): string | null { return this.snapshot().activePlantId; }
  isReadOnly(): boolean {
    const id = this.getActivePlantId();
    return Boolean(id && !this.canWritePlant(id));
  }
  get plants$(): Observable<Planta[]> {
    return new Observable(subscriber => this.state$.subscribe(state => subscriber.next(state.plants)));
  }

  setActivePlant(plantId: string | null): void {
    if (plantId === null && !this.isGlobal()) return;
    if (plantId !== null && !this.canReadPlant(plantId)) return;
    if (plantId) localStorage.setItem(this.storageKey, plantId);
    else localStorage.removeItem(this.storageKey);
    this.stateSubject.next({ ...this.snapshot(), activePlantId: plantId });
  }

  resolveWritePlantId(requested?: string | null): string {
    const profile = this.snapshot().profile;
    if (!profile) throw new Error('PLANT_SCOPE_NOT_READY');
    const plantId = this.isGlobal() ? (requested || this.getActivePlantId()) : profile.plantaIdPrincipal;
    if (!plantId || !this.canWritePlant(plantId)) throw new Error('PLANT_REQUIRED');
    return plantId;
  }

  private async load(): Promise<void> {
    const user = await firstValueFrom(authState(this.auth).pipe(take(1)));
    if (!user) {
      this.stateSubject.next({ ready: true, profile: null, plants: [], activePlantId: null });
      return;
    }
    const profileSnapshot = await getDoc(doc(this.firestore, `usuarios/${user.uid}`));
    if (!profileSnapshot.exists()) {
      this.stateSubject.next({ ready: true, profile: null, plants: [], activePlantId: null });
      return;
    }
    const profile = normalizeUsuarioAutolog(profileSnapshot.id, profileSnapshot.data() as any);
    const plants = profile.accesoTodasPlantas
      ? await firstValueFrom((collectionData(collection(this.firestore, 'plantas'), { idField: 'id' }) as Observable<Planta[]>).pipe(take(1)))
      : (await Promise.all(this.idsFor(profile).map(id => getDoc(doc(this.firestore, `plantas/${id}`)))))
        .filter(snapshot => snapshot.exists())
        .map(snapshot => ({ id: snapshot.id, ...snapshot.data() } as Planta));
    const visible = plants.filter(plant => plant.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
    const saved = localStorage.getItem(this.storageKey);
    const activePlantId = saved && (profile.accesoTodasPlantas || this.idsFor(profile).includes(saved))
      ? saved : (profile.rol === 'planta' ? profile.plantaIdPrincipal : null);
    this.stateSubject.next({ ready: true, profile, plants: visible, activePlantId });
  }

  private idsFor(profile: UsuarioAutolog): string[] {
    return [...new Set([...(profile.plantaIdPrincipal ? [profile.plantaIdPrincipal] : []), ...profile.plantasLectura])];
  }
}
