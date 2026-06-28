import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }

  get username(): string {
    return this.authService.getCurrentUser()?.username ?? 'User';
  }

  get initials(): string {
    const name = this.username;
    return name.substring(0, 2).toUpperCase();
  }
}