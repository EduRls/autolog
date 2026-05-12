import { TestBed } from '@angular/core/testing';

import { HoraService } from './hora.service';

describe('HoraService', () => {
  let service: HoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
