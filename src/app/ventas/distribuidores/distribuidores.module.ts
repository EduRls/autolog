import { AccesoDistribuidorComponent } from 'src/app/components/distribuidor/acceso/acceso-distribuidor.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DistribuidoresPageRoutingModule } from './distribuidores-routing.module';

import { DistribuidoresPage } from './distribuidores.page';
import { MenuComponent } from 'src/app/components/menu/menu.component';
import { ExpedientePersonalComponent } from 'src/app/components/personal/expediente-personal/expediente-personal.component';
import { DistribuidorExpedientePage } from './expediente/distribuidor-expediente.page';
import { AgregarComponent } from 'src/app/components/distribuidor/agregar/agregar.component';
import { EditarComponent } from 'src/app/components/distribuidor/editar/editar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DistribuidoresPageRoutingModule,
    MenuComponent,
    ExpedientePersonalComponent,
    AgregarComponent,
    EditarComponent,
    AccesoDistribuidorComponent
  ],
  declarations: [DistribuidoresPage, DistribuidorExpedientePage]
})
export class DistribuidoresPageModule {}
