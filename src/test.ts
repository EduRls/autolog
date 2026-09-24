// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';
import { PlantScopeService } from './app/services/plants/plant-scope.service';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

const testPlantScope = {
  initialize: () => Promise.resolve(),
  state$: of({ready: true, profile: null, plants: [], activePlantId: null}),
  snapshot: () => ({ready: true, profile: null, plants: [], activePlantId: null}),
  isGlobal: () => true,
  isReadOnly: () => false,
  canReadPlant: () => true,
  canWritePlant: () => true,
  getActivePlantId: () => null,
  getPrincipalPlantId: () => null,
  setActivePlant: () => undefined,
  resolveWritePlantId: (plantId?: string) => plantId || 'test-plant',
};

beforeEach(() => TestBed.configureTestingModule({
  providers: [
    {provide: Auth, useValue: {currentUser: {uid: 'test-user'}}},
    {provide: PlantScopeService, useValue: testPlantScope},
  ],
}));
