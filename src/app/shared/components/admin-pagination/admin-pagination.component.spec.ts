import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPaginationComponent } from './admin-pagination.component';

describe('AdminPaginationComponent', () => {
  let component: AdminPaginationComponent;
  let fixture: ComponentFixture<AdminPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPaginationComponent);
    component = fixture.componentInstance;
  });

  it('shows every page when there are at most twelve', () => {
    fixture.componentRef.setInput('totalPages', 8);
    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();

    expect(component.visiblePages).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(component.hasNextBlock).toBe(false);
  });

  it('uses the twelfth position to advance to the next block', () => {
    fixture.componentRef.setInput('totalPages', 30);
    fixture.detectChanges();

    expect(component.visiblePages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(component.hasNextBlock).toBe(true);

    component.showNextBlock();

    expect(component.visiblePages).toEqual([12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
  });

  it('clamps the current page when applying a larger page size', () => {
    fixture.componentRef.setInput('currentPage', 8);
    fixture.componentRef.setInput('totalPages', 8);
    fixture.componentRef.setInput('totalItems', 38);
    fixture.componentRef.setInput('pageSize', 5);
    fixture.detectChanges();

    const emitted: Array<{ page: number; pageSize: number }> = [];
    component.paginationChange.subscribe((change) => emitted.push(change));
    component.pendingPageSize = 25;
    component.applyPageSize();

    expect(emitted).toEqual([{ page: 2, pageSize: 25 }]);
  });
});
