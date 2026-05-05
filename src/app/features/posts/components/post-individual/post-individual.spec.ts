import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostIndividual } from './post-individual';

describe('PostIndividual', () => {
  let component: PostIndividual;
  let fixture: ComponentFixture<PostIndividual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostIndividual],
    }).compileComponents();

    fixture = TestBed.createComponent(PostIndividual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
