import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IesCampaignManagement } from './ies-campaign-management';

describe('IesCampaignManagement', () => {
  let component: IesCampaignManagement;
  let fixture: ComponentFixture<IesCampaignManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IesCampaignManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IesCampaignManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
