import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/dashboard">TrackNest</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse justify-content-end" id="navbarSupportedContent">
          <ul class="navbar-nav align-items-center">
            <li class="nav-item" *ngIf="isAuthenticated">
              <span class="nav-text me-3">{{ getCurrentUserName() }}</span>
            </li>
            <li class="nav-item" *ngIf="isAuthenticated">
              <button 
                class="btn btn-outline-danger btn-sm" 
                (click)="logout()">
                Logout
              </button>
            </li>
            <li class="nav-item" *ngIf="!isAuthenticated">
              <a class="nav-link" routerLink="/login">Login</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-text {
      color: #333;
    }

    .navbar-nav .nav-link {
      color: rgba(0, 0, 0, 0.8);
    }
    nav.navbar {
      position: relative;
      z-index: 1000;
    }
    .navbar-nav .nav-link:hover {
      color: #0d6efd;
    }
  `]
})
export class NavbarComponent {
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  constructor(private authService: AuthService, private router: Router) {}

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.username || user?.email || 'User';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
