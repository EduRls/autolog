import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { GenerarCodigosPage } from './generar-codigos.page';
import { GenerarCodigosPageModule } from './generar-codigos.module';

describe('GenerarCodigosPage', () => {
  let component: GenerarCodigosPage;
  let fixture: ComponentFixture<GenerarCodigosPage>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), GenerarCodigosPageModule],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(GenerarCodigosPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
