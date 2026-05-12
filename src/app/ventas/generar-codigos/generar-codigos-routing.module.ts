import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GenerarCodigosPage } from './generar-codigos.page';

const routes: Routes = [
  {
    path: '',
    component: GenerarCodigosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GenerarCodigosPageRoutingModule {}
