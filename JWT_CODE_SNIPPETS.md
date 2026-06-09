# JWT Authentication - Code Snippets Reference

## 1️⃣ Login Component Implementation

```typescript
// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.message = '';
    
    if (!this.email || !this.password) {
      this.message = 'Please enter email and password';
      return;
    }

    this.loading = true;
    
    // AuthService handles token storage automatically
    this.authService.login(this.email, this.password).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          // Tokens already stored by service
          this.router.navigate(['/expenses']);
        } else {
          this.message = 'Invalid credentials';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = 'Login failed: ' + err.message;
      }
    });
  }
}
```

---

## 2️⃣ Using AuthService Token Methods

```typescript
// In any component
import { AuthService } from './auth.service';

export class MyComponent {
  constructor(private authService: AuthService) {}

  // Get access token
  getToken() {
    const token = this.authService.getAccessToken();
    console.log('Token:', token);
  }

  // Check if user is authenticated
  checkAuth() {
    if (this.authService.isAuthenticated()) {
      console.log('User is logged in');
    }
  }

  // Get current user
  getCurrentUser() {
    const user = this.authService.getCurrentUser();
    console.log('Logged in as:', user?.email);
  }

  // Logout
  logout() {
    this.authService.logout();
    // All tokens cleared, redirect manually
  }
}
```

---

## 3️⃣ Making API Calls (Automatic Token Attachment)

```typescript
// expense.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = 'https://localhost:7090/api/expenses';

  constructor(private http: HttpClient) {}

  // Token automatically added to Authorization header by interceptor
  getExpenses() {
    return this.http.get(`${this.apiUrl}`);
    // Interceptor adds: Authorization: Bearer [accessToken]
  }

  createExpense(expense: any) {
    return this.http.post(`${this.apiUrl}`, expense);
    // Token automatically added
  }

  updateExpense(id: number, expense: any) {
    return this.http.put(`${this.apiUrl}/${id}`, expense);
    // Token automatically added
  }

  deleteExpense(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
    // Token automatically added
  }
}
```

**No manual Authorization header needed - interceptor handles it!**

---

## 4️⃣ Using Auth Guard on Routes

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuardService } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent 
  },
  {
    path: 'expenses',
    component: ExpenseListComponent,
    canActivate: [AuthGuardService]  // ✓ Protected route
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService]  // ✓ Protected route
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    canActivate: [AuthGuardService]  // ✓ Protected route
  }
];
```

**What happens:**
- ✓ User has token → enters route
- ✗ No token → redirected to `/login`

---

## 5️⃣ Navbar Component with Logout

```typescript
// navbar.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.username || user?.email || 'User';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
```

```html
<!-- navbar.component.html -->
<nav class="navbar">
  <div class="navbar-content">
    <h1>TrackNest</h1>
    
    <div *ngIf="isAuthenticated" class="user-section">
      <span>Welcome, {{ getCurrentUserName() }}</span>
      <button (click)="logout()" class="btn-logout">Logout</button>
    </div>
    
    <div *ngIf="!isAuthenticated" class="login-section">
      <a routerLink="/login">Login</a>
    </div>
  </div>
</nav>
```

---

## 6️⃣ Adding Navbar to App

```typescript
// app.ts (main component)
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './features/auth/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent {}
```

---

## 7️⃣ Expense Component Using Protected API

```typescript
// expense-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../../services/expense.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-list.component.html'
})
export class ExpenseListComponent implements OnInit {
  expenses: any[] = [];
  loading = true;
  error = '';

  constructor(private expenseService: ExpenseService) {}

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.loading = true;
    // Token automatically added by interceptor
    this.expenseService.getExpenses().subscribe({
      next: (data: any) => {
        this.expenses = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load expenses:', err);
        this.error = 'Failed to load expenses';
        this.loading = false;
        // If 401: Interceptor handles refresh + retry
        // If still fails: Interceptor logs out user
      }
    });
  }

  deleteExpense(id: number) {
    // Token automatically added by interceptor
    this.expenseService.deleteExpense(id).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.id !== id);
      },
      error: (err) => {
        this.error = 'Failed to delete expense';
      }
    });
  }
}
```

---

## 8️⃣ Interceptor - What Happens Behind Scenes

```typescript
// auth.interceptor.ts (simplified flow)
intercept(request, next) {
  // 1. Add token to request
  const token = this.authService.getAccessToken();
  if (token) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  // 2. Send request
  return next.handle(request).pipe(
    catchError((error) => {
      // 3. If 401 error
      if (error.status === 401) {
        // 4. Try to refresh token
        return this.authService.refreshToken().pipe(
          switchMap((response) => {
            // 5. Add new token to failed request
            request = request.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` }
            });
            // 6. Retry request with new token
            return next.handle(request);
          })
        );
      }
      return throwError(() => error);
    })
  );
}
```

---

## 9️⃣ Signup Component

```typescript
// signup.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  loading = false;
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    this.message = '';
    
    if (!this.username || !this.email || !this.password) {
      this.message = 'All fields required';
      return;
    }

    this.loading = true;
    
    // Service handles token storage automatically
    this.authService.signup(this.username, this.email, this.password).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          // Logged in automatically
          this.router.navigate(['/expenses']);
        } else {
          this.message = 'Signup failed';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = 'Signup error: ' + err.error?.message;
      }
    });
  }
}
```

---

## 🔟 Error Handling Example

```typescript
// Complete error handling in component
export class SafeAPIComponent implements OnInit {
  data: any;
  loading = false;
  error = '';

  constructor(private service: DataService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';

    this.service.getData().subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        
        // Interceptor might still redirect on 401
        if (err.status === 401) {
          // This shouldn't happen - interceptor handles it
          this.error = 'Session expired. Please login again.';
        } else if (err.status === 403) {
          this.error = 'You do not have permission.';
        } else if (err.status === 404) {
          this.error = 'Resource not found.';
        } else if (err.status === 500) {
          this.error = 'Server error. Please try later.';
        } else {
          this.error = 'An error occurred. Please try again.';
        }
      }
    });
  }
}
```

---

## 🎯 Complete Usage Flow Example

```typescript
// User journey:

// 1. User opens app
// 2. App component loads with navbar
// 3. User clicks login link → redirected to /login

// 4. User enters email/password and clicks login
@Component({ ... })
export class LoginComponent {
  login() {
    this.authService.login(email, password).subscribe({ ... });
    // ↓ API call to /auth/login
    // ↓ Backend returns { accessToken, refreshToken, user }
    // ↓ AuthService stores tokens via setTokens()
    // ↓ Redirect to /expenses
  }
}

// 5. App navigates to /expenses
// 6. AuthGuard checks isAuthenticated() → true → allows access

// 7. ExpenseListComponent loads and calls service
@Component({ ... })
export class ExpenseListComponent {
  ngOnInit() {
    this.expenseService.getExpenses().subscribe(...);
    // ↓ Interceptor adds Authorization header
    // ↓ Token: Authorization: Bearer [access_token]
    // ↓ API call succeeds
  }
}

// 8. User clicks Logout
@Component({ ... })
export class NavbarComponent {
  logout() {
    this.authService.logout();
    // ↓ Clears all tokens
    // ↓ Redirects to /login
  }
}

// 9. If user tries to access /expenses
// 10. AuthGuard checks isAuthenticated() → false → redirects to /login
```

---

Generated: 2026-06-09 | For TrackNest Angular JWT Implementation
