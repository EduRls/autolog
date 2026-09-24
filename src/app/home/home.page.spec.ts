import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { HomePage } from './home.page';
import { HomePageModule } from './home.module';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HomePageModule],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
