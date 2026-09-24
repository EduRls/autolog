import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DistribuidoresPage } from './distribuidores.page';
import { adminGuard } from '../../guards/admin.guard';
import { DistribuidorExpedientePage } from './expediente/distribuidor-expediente.page';

const routes: Routes = [
  {
    path: ':id/expediente',
    component: DistribuidorExpedientePage,
    canActivate: [adminGuard]
  },
  {
    path: '',
    component: DistribuidoresPage,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistribuidoresPageRoutingModule {}
