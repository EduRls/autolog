import { Firestore } from '@angular/fire/firestore';
import { TestBed } from '@angular/core/testing';

import { SorteoService } from './sorteo.service';

describe('SorteoService', () => {
  let service: SorteoService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [{provide: Firestore, useValue: {}}]});
    service = TestBed.inject(SorteoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
