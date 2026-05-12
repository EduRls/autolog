import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IncidentesPageRoutingModule } from './incidentes-routing.module';

import { IncidentesPage } from './incidentes.page';
import { MenuComponent } from 'src/app/components/menu/menu.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IncidentesPageRoutingModule,
    MenuComponent
  ],
  declarations: [IncidentesPage]
})
export class IncidentesPageModule {}
