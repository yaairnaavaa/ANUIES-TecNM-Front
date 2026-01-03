import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IesGestion } from './ies-gestion';

describe('IesGestion', () => {
  let component: IesGestion;
  let fixture: ComponentFixture<IesGestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IesGestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IesGestion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
