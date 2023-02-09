import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCollectionPage } from './edit-collection.page';

describe('EditCollectionPage', () => {
  let component: EditCollectionPage;
  let fixture: ComponentFixture<EditCollectionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditCollectionPage ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCollectionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
