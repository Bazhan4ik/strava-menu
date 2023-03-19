import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishCookComponent } from './item-cook.component';

describe('DishCookComponent', () => {
  let component: DishCookComponent;
  let fixture: ComponentFixture<DishCookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DishCookComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishCookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
