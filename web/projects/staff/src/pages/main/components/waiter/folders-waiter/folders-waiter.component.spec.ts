import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoldersWaiterComponent } from './folders-waiter.component';

describe('FoldersWaiterComponent', () => {
  let component: FoldersWaiterComponent;
  let fixture: ComponentFixture<FoldersWaiterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FoldersWaiterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoldersWaiterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
