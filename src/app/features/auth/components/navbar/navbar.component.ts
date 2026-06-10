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
        
        <div class="navbar-collapse ms-auto">
          <ul class="navbar-nav">
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
