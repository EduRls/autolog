import { Component } from '@angular/core';
import { Medidor, MEDIDOR_ESTADO_COLOR, MEDIDOR_ESTADO_LABEL, MedidorEstado } from '../sgm.models';

@Component({
  selector: 'app-sgm-dashboard',
  templateUrl: './sgm-dashboard.page.html',
  styleUrls: ['../sgm.shared.scss'],
})
export class SgmDashboardPage {
  // TODO: conectar con la fuente de datos de SGM.
  medidores: Medidor[] = [];
  readonly estados: MedidorEstado[] = ['activo', 'alerta', 'inactivo'];
  readonly estadoLabel = MEDIDOR_ESTADO_LABEL;
  readonly estadoColor = MEDIDOR_ESTADO_COLOR;

  countBy(estado: MedidorEstado): number {
    return this.medidores.filter(medidor => medidor.estado === estado).length;
  }

  get ultimaLectura(): Date | null {
    const fechas = this.medidores.map(medidor => medidor.fechaLectura?.getTime() ?? 0).filter(Boolean);
    return fechas.length ? new Date(Math.max(...fechas)) : null;
  }

  get lecturasRecientes(): Medidor[] {
    return this.medidores
      .filter(medidor => medidor.fechaLectura)
      .sort((a, b) => b.fechaLectura!.getTime() - a.fechaLectura!.getTime())
      .slice(0, 8);
  }
}
