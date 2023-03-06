import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerLayoutPage } from './customer-layout.page';

describe('CustomerLayoutPage', () => {
    let component: CustomerLayoutPage;
    let fixture: ComponentFixture<CustomerLayoutPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CustomerLayoutPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomerLayoutPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
