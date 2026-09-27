import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SgmDashboardPage } from './dashboard/sgm-dashboard.page';
import { SgmMedidoresPage } from './medidores/sgm-medidores.page';

export const SGM_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: SgmDashboardPage },
  { path: 'medidores', component: SgmMedidoresPage },
];

@NgModule({
  imports: [RouterModule.forChild(SGM_ROUTES)],
  exports: [RouterModule],
})
export class SgmRoutingModule {}
