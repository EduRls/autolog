import { TestBed } from '@angular/core/testing';

import { DistribuidoresService } from './distribuidores.service';

describe('DistribuidoresService', () => {
  let service: DistribuidoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DistribuidoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
