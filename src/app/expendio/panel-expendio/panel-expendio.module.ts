import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MenuComponent } from '../../components/menu/menu.component';
import { PanelExpendioPageRoutingModule } from './panel-expendio-routing.module';
import { PanelExpendioPage } from './panel-expendio.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, NgApexchartsModule, PanelExpendioPageRoutingModule, MenuComponent],
  declarations: [PanelExpendioPage]
})
export class PanelExpendioPageModule {}
