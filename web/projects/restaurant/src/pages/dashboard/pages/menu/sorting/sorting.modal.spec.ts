import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortingModal } from './sorting.modal';

describe('SortingModal', () => {
  let component: SortingModal;
  let fixture: ComponentFixture<SortingModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SortingModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortingModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
