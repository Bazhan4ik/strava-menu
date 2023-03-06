import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOrderModal } from './add-order.modal';

describe('AddOrderModal', () => {
    let component: AddOrderModal;
    let fixture: ComponentFixture<AddOrderModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddOrderModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddOrderModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
