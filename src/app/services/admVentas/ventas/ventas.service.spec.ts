import { Firestore } from '@angular/fire/firestore';
import { TestBed } from '@angular/core/testing';

import { VentasService } from './ventas.service';

describe('VentasService', () => {
  let service: VentasService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [{provide: Firestore, useValue: {}}]});
    service = TestBed.inject(VentasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
