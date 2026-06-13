import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../Core/services/auth-session.service';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from './interceptor';

describe('authInterceptor', () => {
  const sessionMock = {
    clearSession: vi.fn(),
  };

  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionMock.clearSession.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: sessionMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('adds the bearer token to requests', () => {
    localStorage.setItem('token', 'admin-token');

    http.get(`${environment.apiUrl}/admin/usuarios`).subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/admin/usuarios`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer admin-token');
    request.flush({});
  });

  it.each([401, 403])('clears the session after a protected %s response', (status) => {
    localStorage.setItem('token', 'admin-token');

    http.get(`${environment.apiUrl}/admin/usuarios`).subscribe({ error: () => undefined });

    const request = httpTesting.expectOne(`${environment.apiUrl}/admin/usuarios`);
    request.flush({}, { status, statusText: 'Rejected' });

    expect(sessionMock.clearSession).toHaveBeenCalledWith(true);
  });

  it('does not clear the session when login fails without a token', () => {
    http
      .post(`${environment.apiUrl}/auth/signin`, {
        email: 'admin@vivebook.test',
        password: 'incorrecta',
      })
      .subscribe({ error: () => undefined });

    const request = httpTesting.expectOne(`${environment.apiUrl}/auth/signin`);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(sessionMock.clearSession).not.toHaveBeenCalled();
  });
});
