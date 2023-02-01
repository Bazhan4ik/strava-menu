import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCollectionsModal } from './add-collections.modal';

describe('AddCollectionsModal', () => {
    let component: AddCollectionsModal;
    let fixture: ComponentFixture<AddCollectionsModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddCollectionsModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddCollectionsModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
