import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibroModal } from './libro-modal';

describe('LibroModal', () => {
  let component: LibroModal;
  let fixture: ComponentFixture<LibroModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroModal],
    }).compileComponents();

    fixture = TestBed.createComponent(LibroModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
