import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddElementModal } from './add-element.modal';

describe('AddElementModal', () => {
    let component: AddElementModal;
    let fixture: ComponentFixture<AddElementModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddElementModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddElementModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
