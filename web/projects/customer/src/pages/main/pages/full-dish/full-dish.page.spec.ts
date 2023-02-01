import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullDishPage } from './full-dish.page';

describe('FullDishPage', () => {
    let component: FullDishPage;
    let fixture: ComponentFixture<FullDishPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FullDishPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FullDishPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
