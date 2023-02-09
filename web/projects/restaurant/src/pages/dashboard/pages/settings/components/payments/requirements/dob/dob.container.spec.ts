import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DobContainer } from './dob.container';

describe('DobContainer', () => {
    let component: DobContainer;
    let fixture: ComponentFixture<DobContainer>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DobContainer]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DobContainer);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
