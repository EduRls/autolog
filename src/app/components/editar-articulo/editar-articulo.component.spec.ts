import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { EditarArticuloComponent } from './editar-articulo.component';


describe('EditarArticuloComponent', () => {
  let component: EditarArticuloComponent;
  let fixture: ComponentFixture<EditarArticuloComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), EditarArticuloComponent],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(EditarArticuloComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('articuloDetalles', {id: 'art-1', articulo: 'Filtro', precio: 100, desc: 'Prueba'});
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
