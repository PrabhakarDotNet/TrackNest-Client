import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ExpenseService } from '../../../features/expense/services/expense.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  searchValue = '';

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService
  ) {}

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
    this.expenseService.setSearchTerm(value);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.expenseService.setSearchTerm('');
  }

  logout(): void {
    this.authService.logout();
  }

  get username(): string {
  return this.authService.getCurrentUser()?.displayName ?? 'User';
}

  get initials(): string {
  const name = this.username;
  return name.substring(0, 2).toUpperCase();
}
}