import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConvertidorDictamenPage } from './convertidor-dictamen.page';

describe('ConvertidorDictamenPage', () => {
  let component: ConvertidorDictamenPage;
  let fixture: ComponentFixture<ConvertidorDictamenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConvertidorDictamenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
