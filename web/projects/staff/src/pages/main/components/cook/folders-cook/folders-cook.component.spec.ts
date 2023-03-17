import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoldersCookComponent } from './folders-cook.component';

describe('FoldersCookComponent', () => {
  let component: FoldersCookComponent;
  let fixture: ComponentFixture<FoldersCookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FoldersCookComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoldersCookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
