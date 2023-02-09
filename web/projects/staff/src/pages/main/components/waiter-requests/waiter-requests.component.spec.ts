import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaiterRequestsComponent } from './waiter-requests.component';

describe('WaiterRequestsComponent', () => {
    let component: WaiterRequestsComponent;
    let fixture: ComponentFixture<WaiterRequestsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WaiterRequestsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(WaiterRequestsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
