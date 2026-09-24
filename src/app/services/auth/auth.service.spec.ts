import { ɵAngularFireSchedulers } from '@angular/fire';
import { Auth } from '@angular/fire/auth';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [{provide: Auth, useValue: {}}]});
    TestBed.inject(ɵAngularFireSchedulers);
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
