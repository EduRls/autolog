import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncidentesPage } from './incidentes.page';

describe('IncidentesPage', () => {
  let component: IncidentesPage;
  let fixture: ComponentFixture<IncidentesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IncidentesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
