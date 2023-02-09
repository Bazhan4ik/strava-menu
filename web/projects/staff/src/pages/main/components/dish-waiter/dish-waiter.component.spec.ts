import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishWaiterComponent } from './dish-waiter.component';

describe('DishWaiterComponent', () => {
    let component: DishWaiterComponent;
    let fixture: ComponentFixture<DishWaiterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DishWaiterComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DishWaiterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
