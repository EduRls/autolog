import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { ModalBuscarVentaComponent } from './modal-buscar-venta.component';


describe('ModalBuscarVentaComponent', () => {
  let component: ModalBuscarVentaComponent;
  let fixture: ComponentFixture<ModalBuscarVentaComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ModalBuscarVentaComponent],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(ModalBuscarVentaComponent);
    component = fixture.componentInstance;
    spyOn(component, 'inicializarMapaBase').and.stub();
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
