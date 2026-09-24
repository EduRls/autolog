import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MenuComponent } from '../../components/menu/menu.component';
import { RegistroVentasPageRoutingModule } from './registro-ventas-routing.module';
import { RegistroVentasPage } from './registro-ventas.page';
@NgModule({ imports: [CommonModule, FormsModule, IonicModule, NgApexchartsModule, RegistroVentasPageRoutingModule, MenuComponent], declarations: [RegistroVentasPage] })
export class RegistroVentasPageModule {}
