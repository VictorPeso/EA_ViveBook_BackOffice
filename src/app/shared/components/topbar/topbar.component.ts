import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuariosService } from '../../../Core/services/usuarios.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent implements OnInit {
  appName = 'ViveBook BackOffice';

  private authService = inject(UsuariosService);

  isLoggedIn = this.authService.isAuthenticated;
  showProfileMenu = false;
  userProfile: any = null;

  ngOnInit() {
    //Voy a comentar esto Muye, sino me tira muchos errores
    // if (this.isLoggedIn()) {
    //   this.authService.getProfile().subscribe(user => {
    //     this.userProfile = user;
    //   });
    // }
  }

  toggleMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onLogout() {
    this.authService.logout();
  }
}
