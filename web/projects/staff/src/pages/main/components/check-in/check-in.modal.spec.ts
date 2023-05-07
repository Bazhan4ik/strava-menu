import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckInModal } from './check-in.modal';

describe('CheckInModal', () => {
    let component: CheckInModal;
    let fixture: ComponentFixture<CheckInModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CheckInModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CheckInModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
