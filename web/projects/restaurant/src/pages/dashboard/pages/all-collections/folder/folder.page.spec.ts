import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderPage } from './folder.page';

describe('FolderPage', () => {
    let component: FolderPage;
    let fixture: ComponentFixture<FolderPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FolderPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FolderPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
