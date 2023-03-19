import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemMoreModal } from './item-more.modal';

describe('DishMoreModal', () => {
  let component: ItemMoreModal;
  let fixture: ComponentFixture<ItemMoreModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemMoreModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemMoreModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
