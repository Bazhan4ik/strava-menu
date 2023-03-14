import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddModifierModal } from './add-modifier.modal';

describe('AddModifierModal', () => {
    let component: AddModifierModal;
    let fixture: ComponentFixture<AddModifierModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddModifierModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddModifierModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
