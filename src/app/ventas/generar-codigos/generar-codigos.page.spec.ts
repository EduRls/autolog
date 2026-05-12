import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenerarCodigosPage } from './generar-codigos.page';

describe('GenerarCodigosPage', () => {
  let component: GenerarCodigosPage;
  let fixture: ComponentFixture<GenerarCodigosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerarCodigosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
