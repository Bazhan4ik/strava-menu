import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurePage } from './configure.page';

describe('ConfigurePage', () => {
    let component: ConfigurePage;
    let fixture: ComponentFixture<ConfigurePage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfigurePage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ConfigurePage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
