import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingPage } from './tracking.page';

describe('TrackingPage', () => {
    let component: TrackingPage;
    let fixture: ComponentFixture<TrackingPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TrackingPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TrackingPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
