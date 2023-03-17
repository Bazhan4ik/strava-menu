import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderWaiterModal } from './folder-waiter.modal';

describe('FolderWaiterModal', () => {
  let component: FolderWaiterModal;
  let fixture: ComponentFixture<FolderWaiterModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FolderWaiterModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FolderWaiterModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
