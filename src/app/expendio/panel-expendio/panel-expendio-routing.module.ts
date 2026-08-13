import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PanelExpendioPage } from './panel-expendio.page';

const routes: Routes = [{ path: '', component: PanelExpendioPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PanelExpendioPageRoutingModule {}
