import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesQrCodesPage } from './tables-qr-codes.page';

describe('TablesQrCodesPage', () => {
    let component: TablesQrCodesPage;
    let fixture: ComponentFixture<TablesQrCodesPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TablesQrCodesPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TablesQrCodesPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
