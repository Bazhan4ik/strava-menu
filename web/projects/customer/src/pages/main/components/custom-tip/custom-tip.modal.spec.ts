import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTipModal } from './custom-tip.modal';

describe('CustomTipModal', () => {
    let component: CustomTipModal;
    let fixture: ComponentFixture<CustomTipModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CustomTipModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomTipModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
