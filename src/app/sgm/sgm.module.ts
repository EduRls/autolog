import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MenuComponent } from '../components/menu/menu.component';
import { SgmRoutingModule } from './sgm-routing.module';
import { SgmDashboardPage } from './dashboard/sgm-dashboard.page';
import { SgmMedidoresPage } from './medidores/sgm-medidores.page';
import { SgmActividadesPage } from './actividades/sgm-actividades.page';
import { SgmAlertasPage } from './alertas/sgm-alertas.page';
import { SgmHistorialActividadesPage } from './historial-actividades/sgm-historial-actividades.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, MenuComponent, SgmRoutingModule],
  declarations: [SgmDashboardPage, SgmMedidoresPage, SgmActividadesPage, SgmAlertasPage, SgmHistorialActividadesPage],
})
export class SgmModule {}
