import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaiterRequestModal } from './waiter-request.modal';

describe('WaiterRequestModal', () => {
  let component: WaiterRequestModal;
  let fixture: ComponentFixture<WaiterRequestModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaiterRequestModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaiterRequestModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
