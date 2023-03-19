import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddItemPage } from './add-item.page';

describe('AddDishPage', () => {
    let component: AddItemPage;
    let fixture: ComponentFixture<AddItemPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddItemPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddItemPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
