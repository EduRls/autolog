import { Injectable, isDevMode } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  CollectionReference,
  Firestore,
  QueryDocumentSnapshot,
  QueryConstraint,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from '@angular/fire/firestore';
import {
  ADMINISTRATIVE_ROLE_VALUES,
  isAdministrativeAccount,
  normalizeUsuarioAutolog,
  CreateUsuarioAutologRequest,
  UpdateUsuarioAutologRequest,
  UsuarioAutolog,
  UsuarioAutologDocument,
  UsuarioAutologResult,
} from '../../models/usuario-autolog.model';

export interface UsuariosPageResult {
  usuarios: UsuarioAutolog[];
  nextCursor: QueryDocumentSnapshot<UsuarioAutologDocument> | null;
  hasNext: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  static readonly PAGE_SIZE = 25;

  constructor(
    private readonly functions: Functions,
    private readonly firestore: Firestore
  ) {}

  async getPage(
    cursor: QueryDocumentSnapshot<UsuarioAutologDocument> | null,
    pageSize = UserAdminService.PAGE_SIZE
  ): Promise<UsuariosPageResult> {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new Error('Invalid users page size');
    }
    const visible: Array<{ user: UsuarioAutolog; snapshot: QueryDocumentSnapshot<UsuarioAutologDocument> }> = [];
    let scanCursor = cursor;
    const batchSize = Math.max(pageSize + 1, UserAdminService.PAGE_SIZE);
    try {
      while (visible.length <= pageSize) {
        const candidates = await this.readCandidates(scanCursor, batchSize);
        for (const snapshot of candidates) {
          const user = normalizeUsuarioAutolog(snapshot.id, snapshot.data());
          if (isAdministrativeAccount(user)) visible.push({ user, snapshot });
          if (visible.length > pageSize) break;
        }
        if (candidates.length < batchSize || visible.length > pageSize) break;
        scanCursor = candidates.at(-1)!;
      }
      const page = visible.slice(0, pageSize);
      return {
        usuarios: page.map(item => item.user),
        nextCursor: page.at(-1)?.snapshot ?? null,
        hasNext: visible.length > pageSize,
      };
    } catch (error) {
      if (isDevMode()) {
        const firebaseError = error as { code?: string; message?: string };
        console.error('[UserAdminService.getPage]', {
          operation: 'listAdministrativeUsers',
          code: firebaseError?.code ?? 'unknown',
          message: firebaseError?.message ?? String(error),
          query: { collection: 'usuarios', roles: ADMINISTRATIVE_ROLE_VALUES, orderBy: '__name__ ASC', batchSize, hasCursor: Boolean(cursor) },
        });
      }
      throw error;
    }
  }

  private async readCandidates(
    cursor: QueryDocumentSnapshot<UsuarioAutologDocument> | null,
    batchSize: number
  ): Promise<QueryDocumentSnapshot<UsuarioAutologDocument>[]> {
    // A single-field role index already includes document ID. Missing legacy
    // access fields cannot be queried as "absent" in Firestore.
    const constraints: QueryConstraint[] = [
      where('rol', 'in', ADMINISTRATIVE_ROLE_VALUES),
      orderBy(documentId(), 'asc'),
    ];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(batchSize));
    return (await getDocs(query(this.collectionRef(), ...constraints))).docs;
  }

  async getUsuario(uid: string): Promise<UsuarioAutolog | null> {
    const snapshot = await getDoc(doc(this.collectionRef(), uid));
    if (!snapshot.exists()) return null;
    return normalizeUsuarioAutolog(snapshot.id, snapshot.data());
  }

  async getUsuarioByDistribuidorId(distribuidorId: string): Promise<UsuarioAutolog | null> {
    const snapshot = await getDocs(query(
      this.collectionRef(),
      where('distribuidorId', '==', distribuidorId),
      limit(5)
    ));
    return this.preferredLinkedUser(snapshot.docs);
  }

  async createUser(request: CreateUsuarioAutologRequest): Promise<UsuarioAutologResult> {
    const callable = httpsCallable<CreateUsuarioAutologRequest, UsuarioAutologResult>(
      this.functions,
      'createAutologUser'
    );
    const response = await callable({
      email: request.email.trim().toLowerCase(),
      password: request.password,
      usuario: request.usuario.trim(),
      rol: request.rol,
      tipoPersonal: request.tipoPersonal,
      distribuidorId: request.distribuidorId?.trim() || null,
      accesoAutolog: request.accesoAutolog,
      accesoAsistencia: request.accesoAsistencia,
      plantaIdPrincipal: request.plantaIdPrincipal ?? null,
      plantasLectura: request.plantasLectura ?? [],
      accesoTodasPlantas: request.accesoTodasPlantas ?? ['admin', 'capturista'].includes(request.rol),
      seccionesMenu: request.seccionesMenu,
    });
    return response.data;
  }

  async updateUser(request: UpdateUsuarioAutologRequest): Promise<UsuarioAutologResult> {
    const callable = httpsCallable<UpdateUsuarioAutologRequest, UsuarioAutologResult>(
      this.functions,
      'updateAutologUser'
    );
    const response = await callable({
      uid: request.uid,
      email: request.email.trim().toLowerCase(),
      usuario: request.usuario.trim(),
      rol: request.rol,
      activo: request.activo,
      tipoPersonal: request.tipoPersonal,
      distribuidorId: request.distribuidorId?.trim() || null,
      accesoAutolog: request.accesoAutolog,
      accesoAsistencia: request.accesoAsistencia,
      plantaIdPrincipal: request.plantaIdPrincipal ?? null,
      plantasLectura: request.plantasLectura ?? [],
      accesoTodasPlantas: request.accesoTodasPlantas ?? ['admin', 'capturista'].includes(request.rol),
      seccionesMenu: request.seccionesMenu,
    });
    return response.data;
  }

  async disableUser(uid: string): Promise<UsuarioAutologResult> {
    const callable = httpsCallable<{ uid: string }, UsuarioAutologResult>(
      this.functions,
      'disableAutologUser'
    );
    const response = await callable({ uid });
    return response.data;
  }

  private collectionRef(): CollectionReference<UsuarioAutologDocument> {
    return collection(this.firestore, 'usuarios') as CollectionReference<UsuarioAutologDocument>;
  }

  private preferredLinkedUser(
    documents: QueryDocumentSnapshot<UsuarioAutologDocument>[]
  ): UsuarioAutolog | null {
    const users = documents.map(documentSnapshot => normalizeUsuarioAutolog(
      documentSnapshot.id,
      documentSnapshot.data()
    ));
    return users.find(user => user.activo) ?? users[0] ?? null;
  }
}
