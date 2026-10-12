import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { GaslinkSale } from '../../../services/gaslink-sales/gaslink-sales.models';
import { VentaMapaModalComponent } from './venta-mapa-modal.component';

const sale = (overrides: Partial<GaslinkSale> = {}): GaslinkSale => ({
  id: 'a', plantaId: 'u42LityLtz1l6HM2iCN4', folio: 'GL-2026-V025-04266', fechaVenta: new Date('2026-10-08T23:51:00Z'), empresa: 'Empresa',
  vendedor: 'EC BUTANO', cliente: 'EC-VENTA PUBLICO', formaPago: 'Efectivo', litros: 12, total: 136.44, origen: 'gaslink', sourceHash: 'a',
  duplicateIndex: 1, primeraSincronizacion: null, ultimaSincronizacion: null, fechaExtraccion: null, claveWeb: '377f6da0',
  mapsUrl: 'https://www.google.com/maps?q=22.7709,-102.5832', ubicacion: { latitude: 22.7709, longitude: -102.5832 },
  folioTemporal: 'TMP-20261008-175147', esTemporalApp: true, claveWebTicket: '8-175147', fechaTicket: new Date('2026-10-08T23:51:47Z'), ...overrides
});

describe('VentaMapaModalComponent', () => {
  let fixture: ComponentFixture<VentaMapaModalComponent>;
  let component: VentaMapaModalComponent;
  let modal: jasmine.SpyObj<ModalController>;

  async function create(value: GaslinkSale) {
    modal = jasmine.createSpyObj('ModalController', ['dismiss']);
    modal.dismiss.and.resolveTo(true);
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), VentaMapaModalComponent],
    }).overrideComponent(VentaMapaModalComponent, {
      // El módulo de Ionic del componente standalone aporta su propio ModalController.
      add: { providers: [{ provide: ModalController, useValue: modal }] },
    }).compileComponents();
    fixture = TestBed.createComponent(VentaMapaModalComponent);
    component = fixture.componentInstance;
    component.sale = value;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => fixture?.destroy());

  it('renders the Leaflet map and the sale details', async () => {
    await create(sale());
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.sale-map.leaflet-container')).not.toBeNull();
    expect(host.querySelector('.sale-map-marker')).not.toBeNull();
    const text = host.textContent ?? '';
    expect(text).toContain('GL-2026-V025-04266');
    expect(text).toContain('08/10/2026');
    expect(text).toContain('17:51:47');
    expect(text).toContain('377f6da0');
    expect(text).toContain('8-175147');
    expect(component.coordinates).toBe('22.770900, -102.583200');
  });

  it('offers the Google Maps link and copies the coordinates', async () => {
    await create(sale());
    const write = jasmine.createSpy('writeText').and.resolveTo();
    spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: write } as unknown as Clipboard);
    await component.copyCoordinates();
    expect(write).toHaveBeenCalledWith('22.770900, -102.583200');
    expect(component.copied).toBeTrue();
    const link = (fixture.nativeElement as HTMLElement).querySelector('ion-footer ion-button[target="_blank"]');
    expect(link).not.toBeNull();
  });

  it('explains a sale without valid coordinates and does not build the map', async () => {
    await create(sale({ ubicacion: null, mapsUrl: null }));
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.leaflet-container')).toBeNull();
    expect(host.textContent).toContain('no tiene coordenadas válidas');
    expect(component.coordinates).toBe('');
  });

  it('closes through the modal controller', async () => {
    await create(sale());
    await component.close();
    expect(modal.dismiss).toHaveBeenCalled();
  });
});
