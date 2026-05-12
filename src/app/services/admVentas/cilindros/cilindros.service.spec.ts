import { TestBed } from '@angular/core/testing';

import { CilindrosService } from './cilindros.service';

describe('CilindrosService', () => {
  let service: CilindrosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CilindrosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
