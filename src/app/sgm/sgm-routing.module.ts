import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SgmDashboardPage } from './dashboard/sgm-dashboard.page';
import { SgmMedidoresPage } from './medidores/sgm-medidores.page';
import { SgmActividadesPage } from './actividades/sgm-actividades.page';
import { SgmAlertasPage } from './alertas/sgm-alertas.page';
import { SgmHistorialActividadesPage } from './historial-actividades/sgm-historial-actividades.page';

export const SGM_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: SgmDashboardPage },
  { path: 'medidores', component: SgmMedidoresPage },
  { path: 'actividades', component: SgmActividadesPage },
  { path: 'alertas', component: SgmAlertasPage },
  { path: 'historial-actividades', component: SgmHistorialActividadesPage },
];

@NgModule({
  imports: [RouterModule.forChild(SGM_ROUTES)],
  exports: [RouterModule],
})
export class SgmRoutingModule {}
