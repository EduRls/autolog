import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { DetallesEventoUnidadComponent } from './detalles-evento-unidad.component';


describe('DetallesEventoUnidadComponent', () => {
  let component: DetallesEventoUnidadComponent;
  let fixture: ComponentFixture<DetallesEventoUnidadComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), DetallesEventoUnidadComponent],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(DetallesEventoUnidadComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('datos', []); fixture.componentRef.setInput('evento', {unidad: {id: 'u1', unidad: '01'}});
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
