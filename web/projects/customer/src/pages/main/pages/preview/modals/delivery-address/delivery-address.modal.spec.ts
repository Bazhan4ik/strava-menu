import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryAddressModal } from './delivery-address.modal';

describe('DeliveryAddressModal', () => {
    let component: DeliveryAddressModal;
    let fixture: ComponentFixture<DeliveryAddressModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DeliveryAddressModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DeliveryAddressModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
