import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  // Inicializa el storage
  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Crear o actualizar un registro
  async set(key: string, value: any): Promise<void> {
    await this._storage?.set(key, value);
  }

  // Obtener un registro por su clave
  async get<T = any>(key: string): Promise<T | null> {
    return await this._storage?.get(key);
  }

  // Obtener todos los registros
  async getAll<T = any>(): Promise<{ key: string; value: T }[]> {
    const keys = await this._storage?.keys();
    const result = [];
    for (const key of keys || []) {
      const value = await this._storage?.get(key);
      result.push({ key, value });
    }
    return result;
  }

  // Eliminar un registro por su clave
  async remove(key: string): Promise<void> {
    await this._storage?.remove(key);
  }

  // Limpiar todo el storage
  async clear(): Promise<void> {
    await this._storage?.clear();
  }

  // Comprobar si existe una clave
  async exists(key: string): Promise<boolean> {
    const value = await this._storage?.get(key);
    return value !== null;
  }
}
