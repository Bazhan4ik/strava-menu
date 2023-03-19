import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishLayoutElementComponent } from './item-layout-element.component';

describe('DishLayoutElementComponent', () => {
  let component: DishLayoutElementComponent;
  let fixture: ComponentFixture<DishLayoutElementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DishLayoutElementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishLayoutElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
