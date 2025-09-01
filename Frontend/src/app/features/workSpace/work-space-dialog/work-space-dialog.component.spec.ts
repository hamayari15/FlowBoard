import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceDialogComponent } from './work-space-dialog.component';

describe('WorkSpaceDialogComponent', () => {
  let component: WorkSpaceDialogComponent;
  let fixture: ComponentFixture<WorkSpaceDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkSpaceDialogComponent]
    });
    fixture = TestBed.createComponent(WorkSpaceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
