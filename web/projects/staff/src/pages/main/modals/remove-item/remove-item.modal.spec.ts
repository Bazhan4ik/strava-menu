import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveItemModal } from './remove-item.modal';

describe('RemoveItemModal', () => {
    let component: RemoveItemModal;
    let fixture: ComponentFixture<RemoveItemModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RemoveItemModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(RemoveItemModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
