import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';
import { AgregarEventoComponent } from './agregar-evento.component';


describe('AgregarEventoComponent', () => {
  let component: AgregarEventoComponent;
  let fixture: ComponentFixture<AgregarEventoComponent>;
  let autos$: Subject<any[]>;
  let initialize: jasmine.Spy;
  let plantScope: any;
  let activePlantId: string | null = null;
  let loading: { present: jasmine.Spy; dismiss: jasmine.Spy };

  async function create(getAutos: () => any) {
    initialize = jasmine.createSpy('initialize').and.resolveTo();
    const plants = [{ id: 'planta-z', nombre: 'Planta Zacatecas' }];
    plantScope = {
      initialize,
      getActivePlantId: jasmine.createSpy('getActivePlantId').and.returnValue(activePlantId),
      snapshot: () => ({ plants }),
      isGlobal: () => true,
      setActivePlant: jasmine.createSpy('setActivePlant'),
    };
    loading = { present: jasmine.createSpy('present').and.resolveTo(), dismiss: jasmine.createSpy('dismiss').and.resolveTo(true) };
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AgregarEventoComponent],
      providers: [
        provideRouter([]),
        ...componentTestProviders(),
        { provide: PlantScopeService, useValue: plantScope },
        { provide: FirebaseService, useValue: { getAutos: jasmine.createSpy('getAutos').and.callFake(getAutos), getArticulos: () => of([]) } },
        { provide: LoadingController, useValue: { create: jasmine.createSpy('create').and.resolveTo(loading) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AgregarEventoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => fixture?.destroy());

  it('should create', async () => {
    autos$ = new Subject<any[]>();
    await create(() => autos$);
    expect(component).toBeTruthy();
  });

  it('waits for the permissions before listing units and keeps the selector in loading state', async () => {
    autos$ = new Subject<any[]>();
    await create(() => autos$);
    expect(initialize).toHaveBeenCalled();
    expect(component.autosEstado).toBe('cargando');
    expect(component.placeholderUnidad).toBe('Cargando unidades…');
    expect(loading.present).toHaveBeenCalled();
    expect(loading.dismiss).not.toHaveBeenCalled();
  });

  it('lists the units sorted and closes the loading indicator once they arrive', async () => {
    autos$ = new Subject<any[]>();
    await create(() => autos$);
    autos$.next([{ id: 'b', unidad: 'U-10' }, { id: 'a', unidad: 'U-2' }]);
    expect(component.autosEstado).toBe('listo');
    expect(component.autos.map(auto => auto.unidad)).toEqual(['U-2', 'U-10']);
    expect(component.placeholderUnidad).toBe('Selecciona una unidad');
    expect(loading.dismiss).toHaveBeenCalled();
  });

  it('explains a plant-less user instead of leaving the unit blank', async () => {
    await create(() => throwError(() => new Error('PLANT_CONTEXT_REQUIRED')));
    expect(component.autosEstado).toBe('error');
    expect(component.autosMensaje).toContain('planta asignada');
    // El error llegó antes de mostrar el indicador: no queda ninguno abierto.
    expect(loading.present).not.toHaveBeenCalled();
  });

  it('reports an empty plant and can retry after an error', async () => {
    let calls = 0;
    await create(() => ++calls === 1 ? throwError(() => new Error('network')) : of([]));
    expect(component.autosEstado).toBe('error');
    component.cargarAutos();
    expect(component.autosEstado).toBe('cargando');
    await fixture.whenStable();
    expect(component.autosEstado).toBe('vacio');
    expect(component.autosMensaje).toContain('No hay unidades');
  });
  it('names the active plant when it has no units and lets a global user see all plants', async () => {
    activePlantId = 'planta-z';
    await create(() => of([]));
    expect(component.autosEstado).toBe('vacio');
    expect(component.autosMensaje).toContain('Planta Zacatecas');
    expect(component.puedeVerTodas).toBeTrue();
    component.verTodasLasPlantas();
    expect(plantScope.setActivePlant).toHaveBeenCalledWith(null);
    activePlantId = null;
  });
});
