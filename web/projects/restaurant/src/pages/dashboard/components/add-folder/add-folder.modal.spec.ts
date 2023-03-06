import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFolderModal } from './add-folder.modal';

describe('AddFolderModal', () => {
  let component: AddFolderModal;
  let fixture: ComponentFixture<AddFolderModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddFolderModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFolderModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
