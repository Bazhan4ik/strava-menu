import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDishPage } from './edit-dish.page';

describe('EditDishPage', () => {
  let component: EditDishPage;
  let fixture: ComponentFixture<EditDishPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditDishPage ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDishPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
