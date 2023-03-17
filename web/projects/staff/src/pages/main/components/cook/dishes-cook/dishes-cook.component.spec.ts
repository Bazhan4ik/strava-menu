import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishesCookComponent } from './dishes-cook.component';

describe('DishesCookComponent', () => {
  let component: DishesCookComponent;
  let fixture: ComponentFixture<DishesCookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DishesCookComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishesCookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
