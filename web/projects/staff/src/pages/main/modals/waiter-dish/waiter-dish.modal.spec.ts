import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaiterDishModal } from './waiter-dish.modal';

describe('WaiterDishModal', () => {
    let component: WaiterDishModal;
    let fixture: ComponentFixture<WaiterDishModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WaiterDishModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(WaiterDishModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
