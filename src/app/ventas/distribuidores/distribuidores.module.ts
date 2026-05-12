import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DistribuidoresPageRoutingModule } from './distribuidores-routing.module';

import { DistribuidoresPage } from './distribuidores.page';
import { MenuComponent } from 'src/app/components/menu/menu.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DistribuidoresPageRoutingModule,
    MenuComponent
  ],
  declarations: [DistribuidoresPage]
})
export class DistribuidoresPageModule {}
