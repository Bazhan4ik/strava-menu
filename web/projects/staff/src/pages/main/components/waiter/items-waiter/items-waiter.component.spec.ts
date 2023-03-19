import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsWaiterComponent } from './items-waiter.component';

describe('ItemsWaiterComponent', () => {
    let component: ItemsWaiterComponent;
    let fixture: ComponentFixture<ItemsWaiterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemsWaiterComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ItemsWaiterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
