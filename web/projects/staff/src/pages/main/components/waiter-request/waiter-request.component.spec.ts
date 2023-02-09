import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaiterRequestComponent } from './waiter-request.component';

describe('WaiterRequestComponent', () => {
  let component: WaiterRequestComponent;
  let fixture: ComponentFixture<WaiterRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaiterRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaiterRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
