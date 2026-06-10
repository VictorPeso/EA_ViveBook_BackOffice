import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../Core/services/usuarios.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  // El backend suele pedir name, email y password
  newUser = { name: '', email: '', password: '' };
  isLoading = false;

  private authService = inject(UsuariosService);
  private router = inject(Router);

  onSignup() {
    this.isLoading = true;
    this.authService.signup(this.newUser).subscribe({
      next: (res) => {
        this.isLoading = false;
        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        this.router.navigate(['/auth/signin']); // Redirigimos al login
      },
      error: (err) => {
        this.isLoading = false;
        alert('Error en el registro: ' + (err.error?.message || 'Datos inválidos'));
      },
    });
  }
}
