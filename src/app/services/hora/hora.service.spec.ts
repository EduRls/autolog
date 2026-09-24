import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HoraService } from './hora.service';

describe('HoraService', () => {
  let service: HoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(HoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
