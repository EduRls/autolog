import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PanelControlPageRoutingModule } from './panel-control-routing.module';

import { PanelControlPage } from './panel-control.page';
import { MenuComponent } from 'src/app/components/menu/menu.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LeafletModule } from '@bluehalo/ngx-leaflet';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PanelControlPageRoutingModule,
    NgApexchartsModule,
    LeafletModule,
    MenuComponent
  ],
  declarations: [PanelControlPage]
})
export class PanelControlPageModule {}
