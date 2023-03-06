import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFolderPage } from './add-folder.page';

describe('AddFolderPage', () => {
    let component: AddFolderPage;
    let fixture: ComponentFixture<AddFolderPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddFolderPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddFolderPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
