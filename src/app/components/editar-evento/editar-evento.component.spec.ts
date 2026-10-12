import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';
import { PlantScopeService } from 'src/app/services/plants/plant-scope.service';
import { EditarEventoComponent } from './editar-evento.component';


describe('EditarEventoComponent', () => {
  let component: EditarEventoComponent;
  let fixture: ComponentFixture<EditarEventoComponent>;
  let initialize: jasmine.Spy;
  let loading: { present: jasmine.Spy; dismiss: jasmine.Spy };

  async function create(getAutos: () => any = () => of([])) {
    initialize = jasmine.createSpy('initialize').and.resolveTo();
    loading = { present: jasmine.createSpy('present').and.resolveTo(), dismiss: jasmine.createSpy('dismiss').and.resolveTo(true) };
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), EditarEventoComponent],
      providers: [
        provideRouter([]),
        ...componentTestProviders(),
        { provide: PlantScopeService, useValue: { initialize } },
        { provide: FirebaseService, useValue: { getAutos: jasmine.createSpy('getAutos').and.callFake(getAutos), getArticulos: () => of([]) } },
        { provide: LoadingController, useValue: { create: jasmine.createSpy('create').and.resolveTo(loading) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EditarEventoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('evento', {id: 'evento-1', unidad: {id: 'u1', unidad: '01'}, kilometraje: 100, servicio: 'Revisión', costo: 10, fecha: '2026-09-01', autUser: 'Prueba', articulos: []});
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => fixture?.destroy());

  it('should create', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('contrae los resultados sin borrar la búsqueda al seleccionar un artículo', async () => {
    await create();
    component.articulos = [
      { nombre: 'Filtro de aceite', precio: 150 },
      { nombre: 'Aceite de motor', precio: 220 },
    ];

    component.filtrarArticulos({ target: { value: 'aceite' } });
    expect(component.buscarArticulo).toBe('aceite');
    expect(component.articulosFiltrados.length).toBe(2);

    component.agregarArticulo(component.articulosFiltrados[0]);

    expect(component.buscarArticulo).toBe('aceite');
    expect(component.articulosFiltrados).toEqual([]);
    expect(component.articulosFormArray.length).toBe(1);
  });

  it('waits for permissions and keeps the unit selector in loading state until units arrive', async () => {
    const autos$ = new Subject<any[]>();
    await create(() => autos$);
    expect(initialize).toHaveBeenCalled();
    expect(component.autosEstado).toBe('cargando');
    expect(component.placeholderUnidad).toBe('Cargando unidades…');
    expect(loading.present).toHaveBeenCalled();
    expect(loading.dismiss).not.toHaveBeenCalled();

    autos$.next([{ id: 'u2', unidad: '10' }, { id: 'u1', unidad: '01' }]);
    expect(component.autosEstado).toBe('listo');
    expect(component.autos.map(auto => auto.id)).toEqual(['u1', 'u2']);
    expect(loading.dismiss).toHaveBeenCalled();
  });

  it('keeps the service unit selectable even if it is no longer in the plant list', async () => {
    await create(() => of([{ id: 'u9', unidad: '09' }]));
    expect(component.autosEstado).toBe('listo');
    const current = component.autos.find(auto => auto.id === 'u1');
    expect(current?.unidad).toBe('01');
    expect(current?.sinDatos).toBeTrue();
  });

  it('explains a plant-less user instead of leaving the unit blank', async () => {
    await create(() => throwError(() => new Error('PLANT_CONTEXT_REQUIRED')));
    expect(component.autosEstado).toBe('error');
    expect(component.autosMensaje).toContain('planta asignada');
  });
});
