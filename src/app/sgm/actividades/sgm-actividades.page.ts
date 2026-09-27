import { Component } from '@angular/core';

export type ActividadSeccion = 'calibraciones' | 'verificaciones' | 'mantenimiento' | 'confirmaciones';

interface SeccionActividad {
  id: ActividadSeccion;
  label: string;
  title: string;
  description: string;
  icon: string;
  empty: string;
}

@Component({
  selector: 'app-sgm-actividades',
  templateUrl: './sgm-actividades.page.html',
  styleUrls: ['../sgm.shared.scss', './sgm-actividades.page.scss'],
})
export class SgmActividadesPage {
  readonly secciones: SeccionActividad[] = [
    { id: 'calibraciones', label: 'Calibraciones', title: 'Calibraciones', description: 'Calibraciones realizadas y programadas de los medidores.', icon: 'options-outline', empty: 'Aún no hay calibraciones registradas.' },
    { id: 'verificaciones', label: 'Verificaciones', title: 'Verificaciones', description: 'Verificaciones de funcionamiento y exactitud de los medidores.', icon: 'checkmark-done-outline', empty: 'Aún no hay verificaciones registradas.' },
    { id: 'mantenimiento', label: 'Mantenimiento', title: 'Mantenimiento', description: 'Mantenimientos preventivos y correctivos de los medidores.', icon: 'construct-outline', empty: 'Aún no hay mantenimientos registrados.' },
    { id: 'confirmaciones', label: 'Confirmaciones', title: 'Confirmaciones', description: 'Confirmaciones metrológicas de los medidores.', icon: 'shield-checkmark-outline', empty: 'Aún no hay confirmaciones registradas.' },
  ];
  seccionActiva: ActividadSeccion = 'calibraciones';

  get seccion(): SeccionActividad {
    return this.secciones.find(seccion => seccion.id === this.seccionActiva) ?? this.secciones[0];
  }

  cambiarSeccion(value: unknown): void {
    if (this.secciones.some(seccion => seccion.id === value)) this.seccionActiva = value as ActividadSeccion;
  }
}
