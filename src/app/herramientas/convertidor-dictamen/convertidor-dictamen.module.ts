import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConvertidorDictamenPageRoutingModule } from './convertidor-dictamen-routing.module';

import { ConvertidorDictamenPage } from './convertidor-dictamen.page';
import { MenuComponent } from 'src/app/components/menu/menu.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConvertidorDictamenPageRoutingModule,
    MenuComponent
  ],
  declarations: [ConvertidorDictamenPage]
})
export class ConvertidorDictamenPageModule {}
