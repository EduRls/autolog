import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  CollectionReference,
  Firestore,
  Timestamp,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {
  DocumentoPersonal,
  DocumentoPersonalDocument,
  DocumentoPersonalUploadInput,
  ExpedientePersonalTarget,
  TipoDocumentoPersonal,
} from '../../models/documento-personal.model';
import {
  createDocumentoPersonalMetadata,
  deletePersonalDocumentWithRecovery,
  withUploadCompensation,
} from './personal-document.utils';
import { PersonalDocumentStorageService } from './personal-document-storage.service';

@Injectable({ providedIn: 'root' })
export class PersonalExpedienteService {
  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth,
    private readonly documentStorage: PersonalDocumentStorageService
  ) {}

  async getDocumentos(target: ExpedientePersonalTarget): Promise<DocumentoPersonal[]> {
    const snapshot = await getDocs(query(
      this.collectionRef(target),
      orderBy('uploadedAt', 'desc')
    ));
    return snapshot.docs.map(documentSnapshot => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data(),
    }));
  }

  async getDistribuidorDocumentCoverage(): Promise<Record<string, TipoDocumentoPersonal[]>> {
    const snapshot = await getDocs(query(
      collectionGroup(this.firestore, 'expediente'),
      where('tipoPersonal', '==', 'DISTRIBUIDOR')
    ));
    const coverage = new Map<string, Set<TipoDocumentoPersonal>>();

    snapshot.docs.forEach(documentSnapshot => {
      const documento = documentSnapshot.data() as DocumentoPersonalDocument;
      if (documento.esVersionActual === false) return;
      const distribuidorId = documento.distribuidorId || documento.personalId;
      if (!distribuidorId) return;
      const tipos = coverage.get(distribuidorId) ?? new Set<TipoDocumentoPersonal>();
      tipos.add(documento.tipo);
      coverage.set(distribuidorId, tipos);
    });

    return Object.fromEntries(
      Array.from(coverage.entries()).map(([distribuidorId, tipos]) => [
        distribuidorId,
        Array.from(tipos),
      ])
    );
  }

  async uploadDocumento(
    target: ExpedientePersonalTarget,
    file: File,
    input: DocumentoPersonalUploadInput,
    version = 1,
    replacedDocumentId: string | null = null
  ): Promise<DocumentoPersonal> {
    const uid = this.requireCurrentUserUid();
    const metadataReference = doc(this.collectionRef(target));
    const now = Timestamp.now();

    const uploaded = await withUploadCompensation(
      () => this.documentStorage.uploadDocumento(target, metadataReference.id, file),
      async storageResult => {
        const metadata = createDocumentoPersonalMetadata(
          target,
          uid,
          input,
          storageResult,
          now,
          version,
          replacedDocumentId
        );
        await setDoc(metadataReference, metadata);
      },
      storageResult => this.documentStorage.deleteDocumento(storageResult.storagePath)
    );

    const metadata = createDocumentoPersonalMetadata(
      target,
      uid,
      input,
      uploaded,
      now,
      version,
      replacedDocumentId
    );
    return { id: metadataReference.id, ...metadata };
  }

  async replaceDocumento(
    target: ExpedientePersonalTarget,
    previous: DocumentoPersonal,
    file: File
  ): Promise<DocumentoPersonal> {
    const replacement = await this.uploadDocumento(
      target,
      file,
      {
        tipo: previous.tipo,
        nombre: previous.nombre,
        fechaDocumento: previous.fechaDocumento,
        fechaVencimiento: previous.fechaVencimiento,
        notas: previous.notas,
      },
      previous.version + 1,
      previous.id
    );

    try {
      await updateDoc(doc(this.collectionRef(target), previous.id), {
        esVersionActual: false,
        replacedByDocumentId: replacement.id,
        updatedAt: Timestamp.now(),
      });
      return replacement;
    } catch (error) {
      await this.deleteDocumento(target, replacement).catch(() => undefined);
      throw error;
    }
  }

  async deleteDocumento(
    target: ExpedientePersonalTarget,
    documento: DocumentoPersonal
  ): Promise<void> {
    await deletePersonalDocumentWithRecovery(
      () => this.documentStorage.deleteDocumento(documento.storagePath),
      () => deleteDoc(doc(this.collectionRef(target), documento.id))
    );
  }

  async getDocumentoUrl(documento: DocumentoPersonal): Promise<string> {
    return this.documentStorage.getDocumentoUrl(documento.storagePath);
  }

  private collectionRef(
    target: ExpedientePersonalTarget
  ): CollectionReference<DocumentoPersonalDocument> {
    const collectionName = 'distribuidores';
    return collection(
      this.firestore,
      `${collectionName}/${target.personalId}/expediente`
    ) as CollectionReference<DocumentoPersonalDocument>;
  }

  private requireCurrentUserUid(): string {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('La sesión expiró. Inicia sesión nuevamente.');
    return uid;
  }
}
