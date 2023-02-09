import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishesWaiterComponent } from './dishes-waiter.component';

describe('DishesWaiterComponent', () => {
    let component: DishesWaiterComponent;
    let fixture: ComponentFixture<DishesWaiterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DishesWaiterComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DishesWaiterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
