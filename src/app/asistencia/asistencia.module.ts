import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MenuComponent } from '../components/menu/menu.component';
import { AsistenciaRoutingModule } from './asistencia-routing.module';
import { AsistenciaConfiguracionPage } from './configuracion/asistencia-configuracion.page';
import { AsistenciaPanelPage } from './panel/asistencia-panel.page';
import { AsistenciaRegistrosPage } from './registros/asistencia-registros.page';
import { AsistenciaPuntosPage } from './puntos/asistencia-puntos.page';
import { AsistenciaHorariosPage } from './horarios/asistencia-horarios.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, MenuComponent, AsistenciaRoutingModule],
  declarations: [AsistenciaPanelPage, AsistenciaRegistrosPage, AsistenciaConfiguracionPage, AsistenciaPuntosPage, AsistenciaHorariosPage],
})
export class AsistenciaModule {}
