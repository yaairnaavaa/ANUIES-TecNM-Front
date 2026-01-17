import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IesProfileSettings } from './ies-profile-settings';

describe('IesProfileSettings', () => {
  let component: IesProfileSettings;
  let fixture: ComponentFixture<IesProfileSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IesProfileSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IesProfileSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
