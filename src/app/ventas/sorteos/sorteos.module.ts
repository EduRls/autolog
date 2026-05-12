import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SorteosPageRoutingModule } from './sorteos-routing.module';

import { SorteosPage } from './sorteos.page';
import { MenuComponent } from 'src/app/components/menu/menu.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SorteosPageRoutingModule,
    MenuComponent
  ],
  declarations: [SorteosPage]
})
export class SorteosPageModule {}
