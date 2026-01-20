import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IesUserManagement } from './ies-user-management';

describe('IesUserManagement', () => {
  let component: IesUserManagement;
  let fixture: ComponentFixture<IesUserManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IesUserManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IesUserManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
