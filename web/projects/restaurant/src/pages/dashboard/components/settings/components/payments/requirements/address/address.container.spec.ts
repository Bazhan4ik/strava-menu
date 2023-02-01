import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressContainer } from './address.container';

describe('AddressContainer', () => {
    let component: AddressContainer;
    let fixture: ComponentFixture<AddressContainer>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddressContainer]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddressContainer);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
