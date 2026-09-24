import { Storage } from '@ionic/storage-angular';
import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    const storage = {create: async () => storage, get: async () => null, set: async () => undefined};
    TestBed.configureTestingModule({providers: [{provide: Storage, useValue: storage}]});
    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
