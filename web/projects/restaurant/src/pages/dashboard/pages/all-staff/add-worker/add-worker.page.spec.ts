import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWorkerPage } from './add-worker.page';

describe('AddWorkerPage', () => {
    let component: AddWorkerPage;
    let fixture: ComponentFixture<AddWorkerPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddWorkerPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddWorkerPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
