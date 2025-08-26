import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceDetailsComponent } from './work-space-details.component';

describe('WorkSpaceDetailsComponent', () => {
  let component: WorkSpaceDetailsComponent;
  let fixture: ComponentFixture<WorkSpaceDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkSpaceDetailsComponent]
    });
    fixture = TestBed.createComponent(WorkSpaceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
