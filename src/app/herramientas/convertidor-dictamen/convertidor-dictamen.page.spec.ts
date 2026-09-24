import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ConvertidorDictamenPage } from './convertidor-dictamen.page';

@Component({ selector: 'app-menu', standalone: true, template: '' })
class MenuStubComponent {}

describe('ConvertidorDictamenPage', () => {
  let component: ConvertidorDictamenPage;
  let fixture: ComponentFixture<ConvertidorDictamenPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConvertidorDictamenPage],
      imports: [CommonModule, FormsModule, IonicModule.forRoot(), MenuStubComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ConvertidorDictamenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
