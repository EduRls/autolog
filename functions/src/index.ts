import { initializeApp } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

type AutologRole = 'admin' | 'capturista';

interface CreateUserData {
  email: string;
  password: string;
  usuario: string;
  rol: AutologRole;
  empleadoId?: string | null;
}

interface UpdateUserData {
  uid: string;
  email: string;
  usuario: string;
  rol: AutologRole;
  empleadoId?: string | null;
}

interface DisableUserData {
  uid: string;
}

interface UserResult {
  uid: string;
  email: string;
  activo: boolean;
}

const database = getFirestore();
const adminAuth = getAuth();

export const createAutologUser = onCall<CreateUserData>(async (request): Promise<UserResult> => {
  await requireAdmin(request);
  const email = requireEmail(request.data.email);
  const password = requirePassword(request.data.password);
  const usuario = requireText(request.data.usuario, 'usuario', 120);
  const rol = requireRole(request.data.rol);
  const empleadoId = optionalId(request.data.empleadoId);

  let createdUser: UserRecord | null = null;
  try {
    createdUser = await adminAuth.createUser({ email, password, displayName: usuario, disabled: false });
    const userReference = database.doc(`usuarios/${createdUser.uid}`);

    await database.runTransaction(async transaction => {
      const employeeReference = empleadoId ? database.doc(`empleados/${empleadoId}`) : null;
      const employeeSnapshot = employeeReference ? await transaction.get(employeeReference) : null;
      if (employeeReference && (!employeeSnapshot?.exists || employeeSnapshot.get('estado') === 'INACTIVO')) {
        throw new HttpsError('failed-precondition', 'El empleado no existe o está inactivo.');
      }
      const linkedUid = employeeSnapshot?.get('usuarioUid');
      if (linkedUid && linkedUid !== createdUser?.uid) {
        throw new HttpsError('already-exists', 'El empleado ya tiene una cuenta vinculada.');
      }

      transaction.set(userReference, {
        uid: createdUser?.uid,
        email,
        usuario,
        rol,
        activo: true,
        empleadoId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (employeeReference) {
        transaction.update(employeeReference, {
          usuarioUid: createdUser?.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    return { uid: createdUser.uid, email, activo: true };
  } catch (error) {
    if (createdUser) await adminAuth.deleteUser(createdUser.uid).catch(() => undefined);
    throw callableError(error, 'No fue posible crear la cuenta.');
  }
});

export const updateAutologUser = onCall<UpdateUserData>(async (request): Promise<UserResult> => {
  await requireAdmin(request);
  const uid = requireId(request.data.uid, 'uid');
  const email = requireEmail(request.data.email);
  const usuario = requireText(request.data.usuario, 'usuario', 120);
  const rol = requireRole(request.data.rol);
  const empleadoId = optionalId(request.data.empleadoId);
  const previousAuthUser = await getExistingAuthUser(uid);

  try {
    await adminAuth.updateUser(uid, { email, displayName: usuario });
    await database.runTransaction(async transaction => {
      const userReference = database.doc(`usuarios/${uid}`);
      const userSnapshot = await transaction.get(userReference);
      const previousEmployeeId = optionalId(userSnapshot.get('empleadoId'));
      const previousEmployeeReference = previousEmployeeId
        ? database.doc(`empleados/${previousEmployeeId}`)
        : null;
      const employeeReference = empleadoId ? database.doc(`empleados/${empleadoId}`) : null;

      const previousEmployeeSnapshot = previousEmployeeReference
        ? await transaction.get(previousEmployeeReference)
        : null;
      const employeeSnapshot = employeeReference && empleadoId !== previousEmployeeId
        ? await transaction.get(employeeReference)
        : previousEmployeeSnapshot;

      if (employeeReference && (!employeeSnapshot?.exists || employeeSnapshot.get('estado') === 'INACTIVO')) {
        throw new HttpsError('failed-precondition', 'El empleado no existe o está inactivo.');
      }
      const linkedUid = employeeSnapshot?.get('usuarioUid');
      if (linkedUid && linkedUid !== uid) {
        throw new HttpsError('already-exists', 'El empleado ya tiene otra cuenta vinculada.');
      }

      transaction.set(userReference, {
        uid,
        email,
        usuario,
        rol,
        activo: userSnapshot.exists ? userSnapshot.get('activo') !== false : !previousAuthUser.disabled,
        empleadoId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      if (previousEmployeeReference && previousEmployeeId !== empleadoId && previousEmployeeSnapshot?.get('usuarioUid') === uid) {
        transaction.update(previousEmployeeReference, {
          usuarioUid: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      if (employeeReference) {
        transaction.update(employeeReference, {
          usuarioUid: uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    return { uid, email, activo: !previousAuthUser.disabled };
  } catch (error) {
    await adminAuth.updateUser(uid, {
      email: previousAuthUser.email,
      displayName: previousAuthUser.displayName,
      disabled: previousAuthUser.disabled,
    }).catch(() => undefined);
    throw callableError(error, 'No fue posible actualizar la cuenta.');
  }
});

export const disableAutologUser = onCall<DisableUserData>(async (request): Promise<UserResult> => {
  await requireAdmin(request);
  const uid = requireId(request.data.uid, 'uid');
  if (uid === request.auth?.uid) {
    throw new HttpsError('failed-precondition', 'No puedes desactivar tu propia cuenta.');
  }

  const previousAuthUser = await getExistingAuthUser(uid);
  try {
    await adminAuth.updateUser(uid, { disabled: true });
    await database.doc(`usuarios/${uid}`).set({
      uid,
      email: previousAuthUser.email ?? '',
      activo: false,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { uid, email: previousAuthUser.email ?? '', activo: false };
  } catch (error) {
    await adminAuth.updateUser(uid, { disabled: previousAuthUser.disabled }).catch(() => undefined);
    throw callableError(error, 'No fue posible desactivar la cuenta.');
  }
});

async function requireAdmin<T>(request: CallableRequest<T>): Promise<void> {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  let profile = await database.doc(`usuarios/${request.auth.uid}`).get();

  if (!profile.exists && typeof request.auth.token.email === 'string') {
    const legacy = await database.collection('usuarios')
      .where('email', '==', request.auth.token.email)
      .limit(1)
      .get();
    profile = legacy.docs[0] ?? profile;
  }

  const role = String(profile.get('rol') ?? '').trim().toLowerCase();
  if (!profile.exists || role !== 'admin' || profile.get('activo') === false) {
    throw new HttpsError('permission-denied', 'Se requiere una cuenta administrativa activa.');
  }
}

async function getExistingAuthUser(uid: string): Promise<UserRecord> {
  try {
    return await adminAuth.getUser(uid);
  } catch {
    throw new HttpsError('not-found', 'La cuenta de Authentication no existe.');
  }
}

function requireEmail(value: unknown): string {
  const email = requireText(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'El correo no es válido.');
  }
  return email;
}

function requirePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 6 || value.length > 128) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener entre 6 y 128 caracteres.');
  }
  return value;
}

function requireRole(value: unknown): AutologRole {
  if (value !== 'admin' && value !== 'capturista') {
    throw new HttpsError('invalid-argument', 'El rol no es válido.');
  }
  return value;
}

function requireText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${field} es obligatorio.`);
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw new HttpsError('invalid-argument', `${field} no tiene una longitud válida.`);
  }
  return text;
}

function requireId(value: unknown, field: string): string {
  const id = requireText(value, field, 128);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new HttpsError('invalid-argument', `${field} no es válido.`);
  }
  return id;
}

function optionalId(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return requireId(value, 'empleadoId');
}

function callableError(error: unknown, fallbackMessage: string): HttpsError {
  if (error instanceof HttpsError) return error;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/email-already-exists') {
    return new HttpsError('already-exists', 'Ya existe una cuenta con ese correo.');
  }
  return new HttpsError('internal', fallbackMessage);
}
