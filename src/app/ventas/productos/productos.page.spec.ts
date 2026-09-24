import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { componentTestProviders } from 'src/testing/component-test-providers';
import { ProductosPage } from './productos.page';
import { ProductosPageModule } from './productos.module';

describe('ProductosPage', () => {
  let component: ProductosPage;
  let fixture: ComponentFixture<ProductosPage>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ProductosPageModule],
      providers: [provideRouter([]), ...componentTestProviders()],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductosPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture?.destroy());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
