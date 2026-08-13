import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private readonly storageReady: Promise<Storage>;

  constructor(private storage: Storage) {
    this.storageReady = this.init();
  }

  // Inicializa el storage
  async init(): Promise<Storage> {
    const storage = await this.storage.create();
    this._storage = storage;
    return storage;
  }

  // Crear o actualizar un registro
  async set(key: string, value: any): Promise<void> {
    const storage = await this.storageReady;
    await storage.set(key, value);
  }

  // Obtener un registro por su clave
  async get<T = any>(key: string): Promise<T | null> {
    const storage = await this.storageReady;
    return await storage.get(key);
  }

  // Obtener todos los registros
  async getAll<T = any>(): Promise<{ key: string; value: T }[]> {
    const storage = await this.storageReady;
    const keys = await storage.keys();
    const result = [];
    for (const key of keys || []) {
      const value = await storage.get(key);
      result.push({ key, value });
    }
    return result;
  }

  // Eliminar un registro por su clave
  async remove(key: string): Promise<void> {
    const storage = await this.storageReady;
    await storage.remove(key);
  }

  // Limpiar todo el storage
  async clear(): Promise<void> {
    const storage = await this.storageReady;
    await storage.clear();
  }

  // Comprobar si existe una clave
  async exists(key: string): Promise<boolean> {
    const storage = await this.storageReady;
    const value = await storage.get(key);
    return value !== null;
  }
}
