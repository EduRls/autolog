import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DistribuidoresPage } from './distribuidores.page';

const routes: Routes = [
  {
    path: '',
    component: DistribuidoresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistribuidoresPageRoutingModule {}
