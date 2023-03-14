import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifiersModalModal } from './modifiers-modal.modal';

describe('ModifiersModalModal', () => {
  let component: ModifiersModalModal;
  let fixture: ComponentFixture<ModifiersModalModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModifiersModalModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifiersModalModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
