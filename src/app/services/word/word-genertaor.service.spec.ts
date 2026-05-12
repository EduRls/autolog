import { TestBed } from '@angular/core/testing';

import { WordGenertaorService } from './word-genertaor.service';

describe('WordGenertaorService', () => {
  let service: WordGenertaorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WordGenertaorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
