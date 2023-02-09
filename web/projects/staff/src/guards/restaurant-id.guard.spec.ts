import { TestBed } from '@angular/core/testing';

import { RestaurantIdGuard } from './restaurant-id.guard';

describe('RestaurantIdGuard', () => {
    let guard: RestaurantIdGuard;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        guard = TestBed.inject(RestaurantIdGuard);
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });
});
