import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddIngredientModal } from './add-ingredient.modal';

describe('AddIngredientModal', () => {
  let component: AddIngredientModal;
  let fixture: ComponentFixture<AddIngredientModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddIngredientModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddIngredientModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
