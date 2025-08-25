import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWorkSpaceComponent } from './add-work-space.component';

describe('AddWorkSpaceComponent', () => {
  let component: AddWorkSpaceComponent;
  let fixture: ComponentFixture<AddWorkSpaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddWorkSpaceComponent]
    });
    fixture = TestBed.createComponent(AddWorkSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
