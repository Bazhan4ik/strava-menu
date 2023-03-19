import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditItemPage } from './edit-item.page';

describe('EditDishPage', () => {
  let component: EditItemPage;
  let fixture: ComponentFixture<EditItemPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditItemPage ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditItemPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
