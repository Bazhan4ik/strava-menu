import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerShiftModal } from './worker-shift.modal';

describe('WorkerShiftModal', () => {
  let component: WorkerShiftModal;
  let fixture: ComponentFixture<WorkerShiftModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkerShiftModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerShiftModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
