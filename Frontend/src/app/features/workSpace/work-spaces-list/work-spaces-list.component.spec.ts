import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpacesListComponent } from './work-spaces-list.component';

describe('WorkSpacesListComponent', () => {
  let component: WorkSpacesListComponent;
  let fixture: ComponentFixture<WorkSpacesListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkSpacesListComponent]
    });
    fixture = TestBed.createComponent(WorkSpacesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
