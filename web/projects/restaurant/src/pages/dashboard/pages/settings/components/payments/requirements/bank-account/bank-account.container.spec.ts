import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankAccountContainer } from './bank-account.container';

describe('BankAccountContainer', () => {
  let component: BankAccountContainer;
  let fixture: ComponentFixture<BankAccountContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BankAccountContainer ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankAccountContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
