import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SgmMedidoresService } from 'src/app/services/sgm/sgm-medidores.service';
import {
  ESTADO_OPERACION_COLOR,
  ESTADO_OPERACION_LABEL,
  ESTADOS_OPERACION_MEDIDOR,
  EstadoOperacionMedidor,
  MedidorRegistro,
  RegistroMedidores,
} from '../sgm.models';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-sgm-dashboard',
  templateUrl: './sgm-dashboard.page.html',
  styleUrls: ['../sgm.shared.scss'],
})
export class SgmDashboardPage implements OnInit, OnDestroy {
  registros: RegistroMedidores[] = [];
  state: LoadState = 'loading';
  readonly estados = ESTADOS_OPERACION_MEDIDOR;
  readonly estadoLabel = ESTADO_OPERACION_LABEL;
  readonly estadoColor = ESTADO_OPERACION_COLOR;
  private subscription?: Subscription;

  constructor(private readonly sgmService: SgmMedidoresService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  load(): void {
    this.state = 'loading';
    this.subscription?.unsubscribe();
    this.subscription = this.sgmService.listRegistros().subscribe({
      next: registros => { this.registros = registros; this.state = 'ready'; },
      error: error => { console.error(error); this.state = 'error'; },
    });
  }

  get medidores(): MedidorRegistro[] {
    return this.registros.flatMap(registro => registro.medidores || []);
  }

  countBy(estado: EstadoOperacionMedidor): number {
    return this.medidores.filter(medidor => medidor.estadoOperacion === estado).length;
  }

  get ultimoRegistro(): RegistroMedidores | null {
    return this.registros[0] ?? null;
  }

  get registrosRecientes(): RegistroMedidores[] {
    return this.registros.slice(0, 6);
  }
}
