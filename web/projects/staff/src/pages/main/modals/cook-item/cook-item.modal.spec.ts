import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookDishModal } from './cook-item.modal';

describe('CookDishModal', () => {
    let component: CookDishModal;
    let fixture: ComponentFixture<CookDishModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CookDishModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CookDishModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
