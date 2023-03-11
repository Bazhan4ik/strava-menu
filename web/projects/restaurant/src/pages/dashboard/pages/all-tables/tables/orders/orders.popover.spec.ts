import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersPopover } from './orders.popover';

describe('OrdersPopover', () => {
    let component: OrdersPopover;
    let fixture: ComponentFixture<OrdersPopover>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OrdersPopover]
        })
            .compileComponents();

        fixture = TestBed.createComponent(OrdersPopover);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
