import { Provider } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';
import { VentasService } from 'src/app/services/admVentas/ventas/ventas.service';
import { VentasBuenasService } from 'src/app/services/admVentas/diarias/ventasBuenas/ventas-buenas.service';
import { VentasMalasService } from 'src/app/services/admVentas/diarias/ventasMalas/ventas-malas.service';
import { IncidentesService } from 'src/app/services/admVentas/incidentes/incidentes.service';
import { SorteoService } from 'src/app/services/admVentas/sorteo/sorteo.service';
import { MonitoreogasmakeService } from 'src/app/services/monitoreogasmake.service';
import { GeoLocationService } from 'src/app/services/geo/geo-location.service';
/** Explicit service boundaries for component tests: no Firebase app or HTTP calls. */
export function componentTestProviders(): Provider[] {
  const emptyReads = (...methods: string[]) => Object.fromEntries(methods.map(name => [name, jasmine.createSpy(name).and.returnValue(of([]))]));
  return [
    {provide: Firestore, useValue: {}},
    {provide: FirebaseService, useValue: emptyReads('getAutos', 'getArticulos', 'getEvento', 'getDistribuidores')},
    {provide: DistribuidoresService, useValue: emptyReads('getDistribuidores', 'getAsignacionesVentas')},
    {provide: VentasService, useValue: emptyReads('getVentas', 'getPrecioZonas')},
    {provide: VentasBuenasService, useValue: emptyReads('getVentas')},
    {provide: VentasMalasService, useValue: emptyReads('getVentas')},
    {provide: IncidentesService, useValue: emptyReads('getVentas')},
    {provide: SorteoService, useValue: emptyReads('getDocsSorteos')},
    {provide: MonitoreogasmakeService, useValue: emptyReads('getUsuarios')},
    {provide: StorageService, useValue: {get: jasmine.createSpy('get').and.resolveTo({rol: 'admin', usuario: 'Prueba'}), clear: jasmine.createSpy('clear').and.resolveTo()}},
    {provide: AuthService, useValue: {logout: jasmine.createSpy('logout').and.resolveTo()}},
    {provide: GeoLocationService, useValue: {agregarMarcadores: jasmine.createSpy('agregarMarcadores').and.resolveTo([]), obtenerNombreLugar: jasmine.createSpy('obtenerNombreLugar').and.resolveTo('Lugar de prueba')}},
  ];
}
