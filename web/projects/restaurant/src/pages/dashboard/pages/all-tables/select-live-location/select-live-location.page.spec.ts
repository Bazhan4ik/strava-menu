import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectLiveLocationPage } from './select-live-location.page';

describe('SelectLiveLocationPage', () => {
    let component: SelectLiveLocationPage;
    let fixture: ComponentFixture<SelectLiveLocationPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelectLiveLocationPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SelectLiveLocationPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
