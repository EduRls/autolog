import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConvertidorDictamenPage } from './convertidor-dictamen.page';

const routes: Routes = [
  {
    path: '',
    component: ConvertidorDictamenPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConvertidorDictamenPageRoutingModule {}
