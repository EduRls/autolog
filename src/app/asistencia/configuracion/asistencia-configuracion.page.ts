import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asistencia-configuracion',
  templateUrl: './asistencia-configuracion.page.html',
  styleUrls: ['../asistencia.shared.scss'],
})
export class AsistenciaConfiguracionPage {
  constructor(private readonly router: Router) {}

  configurePoints(): Promise<boolean> { return this.router.navigateByUrl('/asistencia/configuracion/puntos'); }
  readonly futureSettings = [
    { title: 'Horarios y turnos', description: 'Organiza jornadas y asignaciones.', icon: 'calendar-number-outline' },
    { title: 'Tolerancias', description: 'Define márgenes para entradas y salidas.', icon: 'timer-outline' },
    { title: 'Dispositivos', description: 'Administra los dispositivos autorizados.', icon: 'phone-portrait-outline' },
    { title: 'Biometría', description: 'Configura la validación de identidad.', icon: 'scan-outline' },
  ];
}
