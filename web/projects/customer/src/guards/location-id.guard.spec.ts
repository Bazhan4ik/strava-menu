import { TestBed } from '@angular/core/testing';

import { LocationIdGuard } from './location-id.guard';

describe('LocationIdGuard', () => {
  let guard: LocationIdGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(LocationIdGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
