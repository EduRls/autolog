import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IncidentesPage } from './incidentes.page';

const routes: Routes = [
  {
    path: '',
    component: IncidentesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IncidentesPageRoutingModule {}
