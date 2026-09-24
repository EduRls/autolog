import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { MenuComponent } from '../components/menu/menu.component';
import { Planta } from '../models/planta.model';
import { PlantAdminService, PlantPayload } from '../services/plants/plant-admin.service';

@Component({
  selector: 'app-plantas',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, MenuComponent],
  templateUrl: './plantas.page.html',
  styleUrls: ['./plantas.page.scss']
})
export class PlantasPage implements OnInit, OnDestroy {
  plants: Planta[] = [];
  search = '';
  editingId: string | null = null;
  form: PlantPayload = { nombre: '', clave: '', descripcion: '', activo: true };
  saving = false;
  private subscription?: Subscription;

  constructor(
    private readonly service: PlantAdminService,
    private readonly alerts: AlertController,
    private readonly toasts: ToastController
  ) {}

  ngOnInit(): void {
    this.subscription = this.service.list().subscribe(plants => {
      this.plants = [...plants].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
    });
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe(); }
  get filtered(): Planta[] {
    const term = this.search.trim().toLowerCase();
    return term ? this.plants.filter(plant => `${plant.nombre} ${plant.clave}`.toLowerCase().includes(term)) : this.plants;
  }
  get activeCount(): number { return this.plants.filter(plant => plant.activo !== false).length; }
  get inactiveCount(): number { return this.plants.length - this.activeCount; }
  trackPlant(_index: number, plant: Planta): string { return plant.id; }
  plantInitials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'PL';
  }
  edit(plant: Planta): void {
    this.editingId = plant.id;
    this.form = { nombre: plant.nombre, clave: plant.clave, descripcion: plant.descripcion || '', activo: plant.activo };
  }
  reset(): void {
    this.editingId = null;
    this.form = { nombre: '', clave: '', descripcion: '', activo: true };
  }
  async save(): Promise<void> {
    if (this.saving || !this.form.nombre.trim() || !this.form.clave.trim()) return;
    this.saving = true;
    try {
      const payload = { ...this.form, nombre: this.form.nombre.trim(), clave: this.form.clave.trim().toUpperCase(), descripcion: this.form.descripcion.trim() };
      if (this.editingId) await this.service.update(this.editingId, payload);
      else await this.service.create(payload);
      this.reset();
      await this.toast('Planta guardada.', 'success');
    } catch {
      await this.toast('No fue posible guardar la planta.', 'danger');
    } finally { this.saving = false; }
  }
  async toggle(plant: Planta): Promise<void> {
    const activating = plant.activo === false;
    let message = activating ? 'La planta volverá a estar disponible.' : 'La planta dejará de estar disponible para nuevas asignaciones.';
    if (!activating && await this.service.hasActiveUsers(plant.id)) {
      message += ' Hay usuarios activos asociados; revisa sus accesos antes de continuar.';
    }
    const alert = await this.alerts.create({
      header: activating ? 'Activar planta' : 'Desactivar planta', message,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Continuar', role: 'confirm', handler: () => void this.applyToggle(plant, activating) }]
    });
    await alert.present();
  }
  private async applyToggle(plant: Planta, activo: boolean): Promise<void> {
    try {
      await this.service.update(plant.id, { nombre: plant.nombre, clave: plant.clave, descripcion: plant.descripcion || '', activo });
      await this.toast(activo ? 'Planta activada.' : 'Planta desactivada.', 'success');
    } catch { await this.toast('No fue posible cambiar el estado.', 'danger'); }
  }
  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    await (await this.toasts.create({ message, color, duration: 2400, position: 'bottom' })).present();
  }
}
