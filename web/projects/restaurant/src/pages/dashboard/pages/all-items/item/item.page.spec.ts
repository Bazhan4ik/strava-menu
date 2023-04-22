import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemPage } from './item.page';

describe('DishPage', () => {
    let component: ItemPage;
    let fixture: ComponentFixture<ItemPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ItemPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
