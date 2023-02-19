import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientsPage } from './ingredients.page';

describe('IngredientsPage', () => {
    let component: IngredientsPage;
    let fixture: ComponentFixture<IngredientsPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [IngredientsPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(IngredientsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
