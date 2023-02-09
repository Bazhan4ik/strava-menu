import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDishPage } from './add-dish.page';

describe('AddDishPage', () => {
    let component: AddDishPage;
    let fixture: ComponentFixture<AddDishPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddDishPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddDishPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
