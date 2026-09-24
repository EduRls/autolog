import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Distribuidor } from '../../../models/distribuidor.model';
import { DistribuidoresService } from '../../../services/admVentas/distribuidores/distribuidores.service';

type ExpedientePageState = 'loading' | 'ready' | 'not-found' | 'error';

@Component({
  selector: 'app-distribuidor-expediente-page',
  templateUrl: './distribuidor-expediente.page.html',
  styleUrls: ['./distribuidor-expediente.page.scss'],
})
export class DistribuidorExpedientePage implements OnInit {
  distribuidor: Distribuidor | null = null;
  state: ExpedientePageState = 'loading';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly distribuidoresService: DistribuidoresService
  ) {}

  ngOnInit(): void {
    void this.loadDistribuidor();
  }

  async loadDistribuidor(): Promise<void> {
    const distribuidorId = this.route.snapshot.paramMap.get('id');
    if (!distribuidorId) {
      this.state = 'not-found';
      return;
    }

    this.state = 'loading';
    try {
      this.distribuidor = await firstValueFrom(
        this.distribuidoresService.getDistribuidorById(distribuidorId)
      ) ?? null;
      this.state = this.distribuidor ? 'ready' : 'not-found';
    } catch {
      this.distribuidor = null;
      this.state = 'error';
    }
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/distribuidores']);
  }
}
