import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PoliticasPdaPage } from './politicas-pda.page';

const routes: Routes = [
  {
    path: '',
    component: PoliticasPdaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoliticasPdaPageRoutingModule {}
