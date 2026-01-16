import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Aspirant } from './aspirant';

describe('Aspirant', () => {
  let component: Aspirant;
  let fixture: ComponentFixture<Aspirant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aspirant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Aspirant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
