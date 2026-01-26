import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NextStep } from './next-step';

describe('NextStep', () => {
  let component: NextStep;
  let fixture: ComponentFixture<NextStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NextStep]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NextStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
