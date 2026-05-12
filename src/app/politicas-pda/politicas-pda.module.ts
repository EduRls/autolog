import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PoliticasPdaPageRoutingModule } from './politicas-pda-routing.module';

import { PoliticasPdaPage } from './politicas-pda.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PoliticasPdaPageRoutingModule
  ],
  declarations: [PoliticasPdaPage]
})
export class PoliticasPdaPageModule {}
