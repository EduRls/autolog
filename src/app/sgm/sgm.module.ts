import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MenuComponent } from '../components/menu/menu.component';
import { SgmRoutingModule } from './sgm-routing.module';
import { SgmDashboardPage } from './dashboard/sgm-dashboard.page';
import { SgmMedidoresPage } from './medidores/sgm-medidores.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, MenuComponent, SgmRoutingModule],
  declarations: [SgmDashboardPage, SgmMedidoresPage],
})
export class SgmModule {}
