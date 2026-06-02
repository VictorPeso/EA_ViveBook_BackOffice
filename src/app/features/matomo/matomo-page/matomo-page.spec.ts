import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatomoPage } from './matomo-page';

describe('MatomoPage', () => {
  let component: MatomoPage;
  let fixture: ComponentFixture<MatomoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatomoPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MatomoPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
