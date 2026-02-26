import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendToProjectComponent } from './send-to-project.component';

describe('SendToProjectComponent', () => {
  let component: SendToProjectComponent;
  let fixture: ComponentFixture<SendToProjectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SendToProjectComponent]
    });
    fixture = TestBed.createComponent(SendToProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
