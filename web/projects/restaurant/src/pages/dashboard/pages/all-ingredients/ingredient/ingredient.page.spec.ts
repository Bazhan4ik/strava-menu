import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientPage } from './ingredient.page';

describe('IngredientPage', () => {
    let component: IngredientPage;
    let fixture: ComponentFixture<IngredientPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [IngredientPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(IngredientPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
