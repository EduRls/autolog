// Isolated visual entry point. No Firebase application or production providers.
import { Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { UsuariosPage } from '../../app/usuarios/usuarios.page';
import { DistribuidoresPage } from '../../app/ventas/distribuidores/distribuidores.page';
import { DistribuidorExpedientePage } from '../../app/ventas/distribuidores/expediente/distribuidor-expediente.page';
import { MenuComponent } from '../../app/components/menu/menu.component';
import { ExpedientePersonalComponent } from '../../app/components/personal/expediente-personal/expediente-personal.component';
import { UserAdminService } from '../../app/services/auth/user-admin.service';
import { AuthService } from '../../app/services/auth/auth.service';
import { AuthorizationService } from '../../app/services/auth/authorization.service';
import { StorageService } from '../../app/services/storage/storage.service';
import { DistribuidoresService } from '../../app/services/admVentas/distribuidores/distribuidores.service';
import { PersonalExpedienteService } from '../../app/services/personal/personal-expediente.service';
import { normalizeUsuarioAutolog, isAdministrativeAccount, UsuarioAutologDocument } from '../../app/models/usuario-autolog.model';
import { AsistenciaPanelPage } from '../../app/asistencia/panel/asistencia-panel.page';
import { AsistenciaRegistrosPage } from '../../app/asistencia/registros/asistencia-registros.page';
import { AsistenciaConfiguracionPage } from '../../app/asistencia/configuracion/asistencia-configuracion.page';
import { AsistenciaPuntosPage } from '../../app/asistencia/puntos/asistencia-puntos.page';
import { AttendancePointsService } from '../../app/services/attendance/attendance-points.service';
import { AttendancePointInput } from '../../app/models/attendance-point.model';

const profiles: UsuarioAutologDocument[] = [
  {email: 'legacy@example.test', usuario: 'Control Volumétrico (prueba)', rol: 'capturista'},
  {email: 'admin@example.test', usuario: 'Administración (prueba)', rol: 'admin', tipoPersonal: 'SISTEMA', accesoAutolog: true, accesoAsistencia: false},
  {email: 'asistia@example.test', usuario: 'Cuenta ASISTIA excluida', rol: 'empleado', tipoPersonal: 'DISTRIBUIDOR', distribuidorId: 'd1', accesoAutolog: false, accesoAsistencia: true},
  ...Array.from({length: 25}, (_, i) => ({email: `test${i}@example.test`, usuario: `Usuario de prueba ${i + 1}`, rol: 'capturista' as const})),
];
const directory = profiles.map((data, i) => normalizeUsuarioAutolog(String(i), data)).filter(isAdministrativeAccount);
const distributors = [{id: 'd1', nombre: 'ANA PÉREZ (PRUEBA)', ruta: 'R-08', zona: 'gpe', identificador: 'VGBZ-0042', usuarioUid: '2', activo: true}];
let previewPoints = [{id: 'point-1', nombre: 'Sucursal Centro (prueba)', descripcion: 'Ubicación local de demostración', latitude: 22.768056, longitude: -102.533056, radioMetros: 150, activo: true, asignados: 1}];
const previewAssignments = new Map<string, string[]>([['point-1', ['d1']]]);
const previewAttendancePoints = {
  listPoints: async () => previewPoints.map(point => ({...point})),
  listActiveDistributors: async () => distributors.map(({id, nombre, identificador}) => ({id, nombre, identificador})),
  getAssignments: async (id: string) => [...(previewAssignments.get(id) || [])],
  createPoint: async (input: AttendancePointInput) => {
    const id = `point-${previewPoints.length + 1}`;
    previewPoints = [...previewPoints, {...input, id, asignados: input.distribuidorIds.length}];
    previewAssignments.set(id, [...input.distribuidorIds]);
    return {id};
  },
  updatePoint: async (id: string, input: AttendancePointInput) => {
    previewPoints = previewPoints.map(point => point.id === id ? {...input, id, asignados: input.distribuidorIds.length} : point);
    previewAssignments.set(id, [...input.distribuidorIds]);
    return {id};
  },
};
const previewUsers = {
  failNext: false,
  async getPage(cursor: {id: string} | null, size: number) {
    if (this.failNext) { this.failNext = false; throw new Error('Controlled preview failure'); }
    const start = cursor ? directory.findIndex(user => user.id === cursor.id) + 1 : 0;
    const usuarios = directory.slice(start, start + size);
    return {usuarios, nextCursor: usuarios.at(-1) ?? null, hasNext: start + size < directory.length};
  },
  getUsuario: async () => normalizeUsuarioAutolog('2', profiles[2]),
  getUsuarioByDistribuidorId: async () => normalizeUsuarioAutolog('2', profiles[2]),
  createUser: async () => ({uid: 'preview-only', email: 'preview@example.test', activo: true}),
  updateUser: async () => ({uid: 'preview-only', email: 'preview@example.test', activo: true}),
  disableUser: async () => ({uid: 'preview-only', email: 'preview@example.test', activo: false}),
};
@Component({selector: 'app-preview-empty', template: ''})
class EmptyPreviewComponent {}
@Component({
  selector: 'app-root',
  template: `<ion-app><router-outlet></router-outlet><nav class="preview-tools" aria-label="Controles de prueba"><span>Pruebas locales · Sin Firebase</span><a routerLink="/usuarios">Usuarios</a><a routerLink="/distribuidores">Distribuidores</a><a routerLink="/asistencia">Asistencia</a><a routerLink="/asistencia/registros">Registros</a><a routerLink="/asistencia/configuracion">Configuración</a><a routerLink="/asistencia/configuracion/puntos">Puntos</a><button (click)="forceError()">Forzar error de Usuarios</button></nav></ion-app>`,
  styles: ['.preview-tools{position:fixed;bottom:6px;left:6px;z-index:1500;display:flex;flex-wrap:wrap;gap:10px;background:#fff;padding:8px;border:1px solid #ddd;font:12px sans-serif}.preview-tools button{cursor:pointer}'],
})
class PreviewAppComponent {
  constructor(private router: Router) {}
  async forceError() { previewUsers.failNext = true; await this.router.navigateByUrl('/empty'); await this.router.navigateByUrl('/usuarios'); }
}
@NgModule({
  declarations: [PreviewAppComponent, EmptyPreviewComponent, UsuariosPage, DistribuidoresPage, DistribuidorExpedientePage, AsistenciaPanelPage, AsistenciaRegistrosPage, AsistenciaConfiguracionPage, AsistenciaPuntosPage],
  imports: [BrowserModule, FormsModule, IonicModule.forRoot(), MenuComponent, ExpedientePersonalComponent, RouterModule.forRoot([
    {path: 'usuarios', component: UsuariosPage},
    {path: 'distribuidores', component: DistribuidoresPage},
    {path: 'distribuidores/:id/expediente', component: DistribuidorExpedientePage},
    {path: 'asistencia', component: AsistenciaPanelPage},
    {path: 'asistencia/registros', component: AsistenciaRegistrosPage},
    {path: 'asistencia/configuracion', component: AsistenciaConfiguracionPage},
    {path: 'asistencia/configuracion/puntos', component: AsistenciaPuntosPage},
    {path: 'empty', component: EmptyPreviewComponent},
    {path: '**', redirectTo: 'usuarios'},
  ])],
  providers: [
    {provide: UserAdminService, useValue: previewUsers},
    {provide: AuthService, useValue: {logout: async () => undefined}},
    {provide: AuthorizationService, useValue: {isCurrentUserAdmin: async () => true}},
    {provide: StorageService, useValue: {get: async () => ({rol: 'admin', usuario: 'Vista de prueba'}), clear: async () => undefined}},
    {provide: DistribuidoresService, useValue: {getDistribuidores: () => of(distributors), getDistribuidorById: () => of(distributors[0]), updateDistribuidor: async () => undefined, addDistribuidor: async () => ({id: 'preview-response'}), deactivateDistribuidor: async () => undefined}},
    {provide: PersonalExpedienteService, useValue: {getDistribuidorDocumentCoverage: async () => ({}), getDocumentos: async () => []}},
    {provide: AttendancePointsService, useValue: previewAttendancePoints},
  ],
  bootstrap: [PreviewAppComponent],
})
class PreviewModule {}
platformBrowserDynamic().bootstrapModule(PreviewModule).catch(console.error);
