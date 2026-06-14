import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastService } from '../../../Core/services/toast.service';
import { Toast } from './toast';

describe('Toast', () => {
  let component: Toast;
  let fixture: ComponentFixture<Toast>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toast],
    }).compileComponents();

    fixture = TestBed.createComponent(Toast);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a toast with its visual type', () => {
    toastService.success('Usuario actualizado');
    fixture.detectChanges();

    const toast: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.toast-card--success');

    expect(toast?.textContent).toContain('Usuario actualizado');
  });

  it('should remove a toast when it is clicked', () => {
    toastService.warning('Revisa los datos');
    fixture.detectChanges();

    const toast: HTMLButtonElement = fixture.nativeElement.querySelector('.toast-card');
    toast.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.toast-card')).toBeNull();
  });
});
