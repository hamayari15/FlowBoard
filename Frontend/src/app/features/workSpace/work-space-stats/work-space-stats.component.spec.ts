import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceStatsComponent } from './work-space-stats.component';

describe('WorkSpaceStatsComponent', () => {
  let component: WorkSpaceStatsComponent;
  let fixture: ComponentFixture<WorkSpaceStatsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkSpaceStatsComponent]
    });
    fixture = TestBed.createComponent(WorkSpaceStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
