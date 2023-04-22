import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillInfoComponent } from './bill-info.component';

describe('BillInfoComponent', () => {
  let component: BillInfoComponent;
  let fixture: ComponentFixture<BillInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BillInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
