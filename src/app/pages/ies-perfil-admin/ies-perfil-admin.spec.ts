import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IesPerfilAdmin } from './ies-perfil-admin';

describe('IesPerfilAdmin', () => {
  let component: IesPerfilAdmin;
  let fixture: ComponentFixture<IesPerfilAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IesPerfilAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IesPerfilAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
