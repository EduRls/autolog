import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { HistorialPage } from './historial.page';
import { HistorialPageModule } from './historial.module';

describe('HistorialPage', () => {
  let component: HistorialPage;
  let fixture: ComponentFixture<HistorialPage>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HistorialPageModule],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(HistorialPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
