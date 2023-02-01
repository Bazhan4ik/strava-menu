import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishMoreModal } from './dish-more.modal';

describe('DishMoreModal', () => {
  let component: DishMoreModal;
  let fixture: ComponentFixture<DishMoreModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DishMoreModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishMoreModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
