import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCollectionPage } from './add-collection.page';

describe('AddCollectionPage', () => {
    let component: AddCollectionPage;
    let fixture: ComponentFixture<AddCollectionPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddCollectionPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddCollectionPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
