import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectDishesModal } from './select-items.modal';

describe('SelectDishesModal', () => {
    let component: SelectDishesModal;
    let fixture: ComponentFixture<SelectDishesModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelectDishesModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SelectDishesModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
