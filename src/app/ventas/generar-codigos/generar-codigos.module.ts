import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GenerarCodigosPageRoutingModule } from './generar-codigos-routing.module';

import { GenerarCodigosPage } from './generar-codigos.page';
import { MenuComponent } from 'src/app/components/menu/menu.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GenerarCodigosPageRoutingModule,
    MenuComponent,
    ReactiveFormsModule
  ],
  declarations: [GenerarCodigosPage]
})
export class GenerarCodigosPageModule {}
