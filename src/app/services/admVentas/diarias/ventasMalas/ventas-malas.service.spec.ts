import { TestBed } from '@angular/core/testing';

import { VentasMalasService } from './ventas-malas.service';

describe('VentasMalasService', () => {
  let service: VentasMalasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VentasMalasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
