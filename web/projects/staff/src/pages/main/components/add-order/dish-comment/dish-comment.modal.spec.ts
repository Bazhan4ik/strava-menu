import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishCommentModal } from './dish-comment.modal';

describe('DishCommentModal', () => {
    let component: DishCommentModal;
    let fixture: ComponentFixture<DishCommentModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DishCommentModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DishCommentModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
