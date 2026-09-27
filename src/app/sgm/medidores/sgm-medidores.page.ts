import { Component } from '@angular/core';
import { Medidor, MEDIDOR_ESTADO_COLOR, MEDIDOR_ESTADO_LABEL } from '../sgm.models';

@Component({
  selector: 'app-sgm-medidores',
  templateUrl: './sgm-medidores.page.html',
  styleUrls: ['../sgm.shared.scss'],
})
export class SgmMedidoresPage {
  // TODO: conectar con la fuente de datos de SGM.
  medidores: Medidor[] = [];
  searchTerm = '';
  readonly estadoLabel = MEDIDOR_ESTADO_LABEL;
  readonly estadoColor = MEDIDOR_ESTADO_COLOR;

  get medidoresFiltrados(): Medidor[] {
    const term = this.normalize(this.searchTerm.trim());
    if (!term) return this.medidores;
    return this.medidores.filter(medidor =>
      [medidor.clave, medidor.ubicacion, medidor.tipo].some(value => this.normalize(value).includes(term)));
  }

  private normalize(value: string): string {
    return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
}
