import { TestBed } from '@angular/core/testing';

import { VentasBuenasService } from './ventas-buenas.service';

describe('VentasBuenasService', () => {
  let service: VentasBuenasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VentasBuenasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
