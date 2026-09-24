import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminGuard } from '../guards/admin.guard';
import { AsistenciaConfiguracionPage } from './configuracion/asistencia-configuracion.page';
import { AsistenciaPanelPage } from './panel/asistencia-panel.page';
import { AsistenciaRegistrosPage } from './registros/asistencia-registros.page';
import { AsistenciaPuntosPage } from './puntos/asistencia-puntos.page';

export const ASISTENCIA_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: AsistenciaPanelPage },
  { path: 'registros', component: AsistenciaRegistrosPage },
  { path: 'configuracion/puntos', component: AsistenciaPuntosPage, canActivate: [adminGuard] },
  { path: 'configuracion', component: AsistenciaConfiguracionPage, canActivate: [adminGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(ASISTENCIA_ROUTES)],
  exports: [RouterModule],
})
export class AsistenciaRoutingModule {}
