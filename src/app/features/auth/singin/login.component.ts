import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuariosService } from '../../../Core/services/usuarios.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { getApiErrorMessage } from '../../../Core/models/api-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth-shell.css',
})
export class LoginComponent implements OnInit {
  credentials = { email: '', password: '' };
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly sessionMessage = signal('');

  private readonly authService = inject(UsuariosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    if (this.authService.updateAuthState()) {
      void this.router.navigate(['/matomo']);
      return;
    }

    const sessionReason = this.route.snapshot.queryParamMap.get('session');
    this.sessionMessage.set(
      sessionReason === 'expired'
        ? 'Tu sesión ha expirado o ya no es válida. Inicia sesión de nuevo.'
        : sessionReason === 'rejected'
          ? 'El Backend ha rechazado tu acceso administrativo. Inicia sesión con una cuenta autorizada.'
          : '',
    );
  }

  onLogin(): void {
    this.errorMessage.set('');
    this.sessionMessage.set('');
    this.isLoading.set(true);

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/matomo']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.authService.clearSession();
        this.errorMessage.set(
          getApiErrorMessage(
            err,
            err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
          ),
        );
      },
    });
  }
}
