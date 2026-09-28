import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { EditarEventoComponent } from './editar-evento.component';


describe('EditarEventoComponent', () => {
  let component: EditarEventoComponent;
  let fixture: ComponentFixture<EditarEventoComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), EditarEventoComponent],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(EditarEventoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('evento', {id: 'evento-1', unidad: {id: 'u1', unidad: '01'}, kilometraje: 100, servicio: 'Revisión', costo: 10, fecha: '2026-09-01', autUser: 'Prueba', articulos: []});
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('contrae los resultados sin borrar la búsqueda al seleccionar un artículo', () => {
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
});
