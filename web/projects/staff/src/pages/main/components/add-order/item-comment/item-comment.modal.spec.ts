import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemCommentModal } from './item-comment.modal';

describe('ItemCommentModal', () => {
    let component: ItemCommentModal;
    let fixture: ComponentFixture<ItemCommentModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemCommentModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ItemCommentModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
