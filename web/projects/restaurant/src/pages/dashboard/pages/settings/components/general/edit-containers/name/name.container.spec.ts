import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NameContainer } from './name.container';

describe('NameContainer', () => {
    let component: NameContainer;
    let fixture: ComponentFixture<NameContainer>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NameContainer]
        })
            .compileComponents();

        fixture = TestBed.createComponent(NameContainer);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
