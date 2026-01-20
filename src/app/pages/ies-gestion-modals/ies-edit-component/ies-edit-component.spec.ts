import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IesEditComponent } from './ies-edit-component';

describe('IesEditComponent', () => {
  let component: IesEditComponent;
  let fixture: ComponentFixture<IesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IesEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IesEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
