import { Component, OnDestroy, OnInit } from '@angular/core';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { AgregarUsuarioComponent } from '../components/agregar-usuario/agregar-usuario.component';
import { EditarUsuarioComponent } from '../components/editar-usuario/editar-usuario.component';
import { UsuarioAutolog, UsuarioAutologDocument } from '../models/usuario-autolog.model';
import { UserAdminService } from '../services/auth/user-admin.service';

type UsuariosState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit, OnDestroy {
  readonly pageSize = UserAdminService.PAGE_SIZE;
  usuarios: UsuarioAutolog[] = [];
  state: UsuariosState = 'loading';
  pageNumber = 1;
  hasNext = false;

  private nextCursor: QueryDocumentSnapshot<UsuarioAutologDocument> | null = null;
  private pageStartCursors: Array<QueryDocumentSnapshot<UsuarioAutologDocument> | null> = [null];
  private destroyed = false;
  private requestSequence = 0;

  constructor(
    private readonly userAdminService: UserAdminService,
    private readonly modalController: ModalController,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    void this.loadInitialPage();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.requestSequence++;
  }

  async loadInitialPage(): Promise<void> {
    this.pageNumber = 1;
    this.pageStartCursors = [null];
    await this.loadPage(null);
  }

  async nextPage(): Promise<void> {
    if (this.state === 'loading' || !this.hasNext || !this.nextCursor) return;
    const cursor = this.nextCursor;
    if (await this.loadPage(cursor)) {
      this.pageStartCursors.push(cursor);
      this.pageNumber++;
    }
  }

  async previousPage(): Promise<void> {
    if (this.state === 'loading' || this.pageNumber === 1) return;
    if (await this.loadPage(this.pageStartCursors.at(-2) ?? null)) {
      this.pageStartCursors.pop();
      this.pageNumber--;
    }
  }

  async agregarUsuario(): Promise<void> {
    const modal = await this.modalController.create({
      component: AgregarUsuarioComponent,
      cssClass: ['autolog-form-modal', 'autolog-user-access-modal'],
    });
    await modal.present();
    const result = await modal.onDidDismiss<{ changed: boolean }>();
    if (result.data?.changed) await this.loadInitialPage();
  }

  async editarUsuario(usuario: UsuarioAutolog): Promise<void> {
    const modal = await this.modalController.create({
      component: EditarUsuarioComponent,
      cssClass: ['autolog-form-modal', 'autolog-user-access-modal'],
      componentProps: { usuarioData: usuario, allowDisable: false },
    });
    await modal.present();
    const result = await modal.onDidDismiss<{ changed: boolean }>();
    if (result.data?.changed) await this.loadPage(this.pageStartCursors.at(-1) ?? null);
  }

  roleLabel(usuario: UsuarioAutolog): string {
    return {
      admin: 'Administrador',
      capturista: 'Capturista',
      planta: 'Planta',
    }[usuario.rol];
  }

  async confirmarDesactivacion(usuario: UsuarioAutolog): Promise<void> {
    if (!usuario.activo) return;
    const alert = await this.alertController.create({
      header: 'Desactivar usuario',
      message: `La cuenta de ${usuario.usuario} dejará de poder iniciar sesión. No se eliminará información.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Desactivar', role: 'destructive', handler: () => void this.desactivarUsuario(usuario) },
      ],
    });
    await alert.present();
  }

  private async loadPage(cursor: QueryDocumentSnapshot<UsuarioAutologDocument> | null): Promise<boolean> {
    const requestId = ++this.requestSequence;
    this.state = 'loading';
    try {
      const result = await this.userAdminService.getPage(cursor, this.pageSize);
      if (this.destroyed || requestId !== this.requestSequence) return false;
      this.usuarios = result.usuarios;
      this.nextCursor = result.nextCursor;
      this.hasNext = result.hasNext;
      this.state = this.usuarios.length ? 'ready' : 'empty';
      return true;
    } catch {
      if (this.destroyed || requestId !== this.requestSequence) return false;
      this.usuarios = [];
      this.hasNext = false;
      this.state = 'error';
      return false;
    }
  }

  private async desactivarUsuario(usuario: UsuarioAutolog): Promise<void> {
    try {
      await this.userAdminService.disableUser(usuario.uid);
      await this.presentToast('Usuario desactivado en Authentication y Firestore.', 'success');
      await this.loadPage(this.pageStartCursors.at(-1) ?? null);
    } catch {
      await this.presentToast('No fue posible desactivar el usuario.', 'danger');
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2400, color, position: 'bottom' });
    await toast.present();
  }
}
