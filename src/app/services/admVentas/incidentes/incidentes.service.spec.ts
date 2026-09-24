import { Firestore } from '@angular/fire/firestore';
import { TestBed } from '@angular/core/testing';

import { IncidentesService } from './incidentes.service';

describe('IncidentesService', () => {
  let service: IncidentesService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [{provide: Firestore, useValue: {}}]});
    service = TestBed.inject(IncidentesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
