import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTableModal } from './select-table.modal';

describe('SelectTableModal', () => {
    let component: SelectTableModal;
    let fixture: ComponentFixture<SelectTableModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelectTableModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SelectTableModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
