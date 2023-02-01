import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRestaurantPage } from './add-restaurant.page';

describe('AddRestaurantPage', () => {
  let component: AddRestaurantPage;
  let fixture: ComponentFixture<AddRestaurantPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRestaurantPage ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRestaurantPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
