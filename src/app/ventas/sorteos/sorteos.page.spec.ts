import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SorteosPage } from './sorteos.page';

describe('SorteosPage', () => {
  let component: SorteosPage;
  let fixture: ComponentFixture<SorteosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SorteosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
