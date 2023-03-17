import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderCookModal } from './folder-cook.modal';

describe('FolderModal', () => {
    let component: FolderCookModal;
    let fixture: ComponentFixture<FolderCookModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FolderCookModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FolderCookModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
