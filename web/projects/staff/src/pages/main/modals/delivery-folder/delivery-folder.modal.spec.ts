import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryFolderModal } from './delivery-folder.modal';

describe('DeliveryFolderModal', () => {
    let component: DeliveryFolderModal;
    let fixture: ComponentFixture<DeliveryFolderModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DeliveryFolderModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DeliveryFolderModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
