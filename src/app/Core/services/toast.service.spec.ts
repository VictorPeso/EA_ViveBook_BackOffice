import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose helpers for every toast type', () => {
    service.success('Guardado');
    service.error('Error');
    service.warning('Aviso');
    service.info('Informacion');

    expect(service.toasts().map(({ type, text }) => ({ type, text }))).toEqual([
      { type: 'success', text: 'Guardado' },
      { type: 'error', text: 'Error' },
      { type: 'warning', text: 'Aviso' },
      { type: 'info', text: 'Informacion' },
    ]);
  });

  it('should assign a unique id to toasts created together', () => {
    const firstId = service.info('Primero');
    const secondId = service.info('Segundo');

    expect(firstId).not.toBe(secondId);
  });

  it('should remove a toast after its duration', () => {
    vi.useFakeTimers();
    service.info('Temporal');

    vi.advanceTimersByTime(3000);

    expect(service.toasts()).toEqual([]);
    vi.useRealTimers();
  });
});
