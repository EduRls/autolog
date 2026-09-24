import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { PanelControlPage } from './panel-control.page';
import { PanelControlPageModule } from './panel-control.module';

describe('PanelControlPage', () => {
  let component: PanelControlPage;
  let fixture: ComponentFixture<PanelControlPage>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PanelControlPageModule],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(PanelControlPage);
    component = fixture.componentInstance;
    spyOn(component, 'inicializarMapa').and.stub();
    fixture.detectChanges();
    // The live clock schedules a persistent interval; destroy() cancels it.
    await Promise.resolve();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
