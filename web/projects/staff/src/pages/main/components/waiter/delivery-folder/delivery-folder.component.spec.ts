import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryFolderComponent } from './delivery-folder.component';

describe('DeliveryFolderComponent', () => {
    let component: DeliveryFolderComponent;
    let fixture: ComponentFixture<DeliveryFolderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DeliveryFolderComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DeliveryFolderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
