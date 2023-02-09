import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniTrackingComponent } from './mini-tracking.component';

describe('MiniTrackingComponent', () => {
    let component: MiniTrackingComponent;
    let fixture: ComponentFixture<MiniTrackingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MiniTrackingComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(MiniTrackingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
