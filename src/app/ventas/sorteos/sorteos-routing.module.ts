import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SorteosPage } from './sorteos.page';

const routes: Routes = [
  {
    path: '',
    component: SorteosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SorteosPageRoutingModule {}
