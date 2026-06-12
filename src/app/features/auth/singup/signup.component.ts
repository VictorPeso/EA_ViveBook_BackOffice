import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../Core/services/usuarios.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { getApiErrorMessage } from '../../../Core/models/api-response.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: '../auth-shell.css',
})
export class SignupComponent {
  newUser = { name: '', email: '', password: '' };
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  private authService = inject(UsuariosService);
  private router = inject(Router);

  onSignup(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);
    this.authService.signup(this.newUser).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Cuenta de administrador creada. Ya puedes iniciar sesión.');
        this.newUser = { name: '', email: '', password: '' };
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(getApiErrorMessage(err, 'No se pudo crear la cuenta.'));
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/auth']);
  }
}
