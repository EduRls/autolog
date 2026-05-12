import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelControlPage } from './panel-control.page';

describe('PanelControlPage', () => {
  let component: PanelControlPage;
  let fixture: ComponentFixture<PanelControlPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelControlPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
