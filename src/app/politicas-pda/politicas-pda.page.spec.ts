import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoliticasPdaPage } from './politicas-pda.page';

describe('PoliticasPdaPage', () => {
  let component: PoliticasPdaPage;
  let fixture: ComponentFixture<PoliticasPdaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PoliticasPdaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
