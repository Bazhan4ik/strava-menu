import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveDishModal } from './remove-dish.modal';

describe('RemoveDishModal', () => {
    let component: RemoveDishModal;
    let fixture: ComponentFixture<RemoveDishModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RemoveDishModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(RemoveDishModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
