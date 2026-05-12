import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DetallesEventoUnidadComponent } from './detalles-evento-unidad.component';

describe('DetallesEventoUnidadComponent', () => {
  let component: DetallesEventoUnidadComponent;
  let fixture: ComponentFixture<DetallesEventoUnidadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetallesEventoUnidadComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DetallesEventoUnidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
