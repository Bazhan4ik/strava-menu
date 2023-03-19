import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsPage } from './items.page';

describe('DishesPage', () => {
    let component: ItemsPage;
    let fixture: ComponentFixture<ItemsPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemsPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ItemsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
