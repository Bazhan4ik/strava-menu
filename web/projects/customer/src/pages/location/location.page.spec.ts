import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPage } from './location.page';

describe('LocationPage', () => {
    let component: LocationPage;
    let fixture: ComponentFixture<LocationPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LocationPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LocationPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
