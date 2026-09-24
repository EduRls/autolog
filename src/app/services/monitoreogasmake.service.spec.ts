import { Firestore } from '@angular/fire/firestore';
import { TestBed } from '@angular/core/testing';

import { MonitoreogasmakeService } from './monitoreogasmake.service';

describe('MonitoreogasmakeService', () => {
  let service: MonitoreogasmakeService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [{provide: Firestore, useValue: {}}]});
    service = TestBed.inject(MonitoreogasmakeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
