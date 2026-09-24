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
});
