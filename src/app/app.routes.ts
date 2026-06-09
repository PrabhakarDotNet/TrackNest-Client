import { Routes } from '@angular/router';
import { ExpenseDashboardComponent } from './pages/expense-dashboard/expense-dashboard.component';
import { ExpenseListComponent } from './features/expense/components/expense-list/expense-list.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { SignupComponent } from './features/auth/components/signup/signup.component';
import { AuthGuardService } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'dashboard',
    component: ExpenseDashboardComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'expenses',
    component: ExpenseListComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: '',
    component: ExpenseDashboardComponent,
    canActivate: [AuthGuardService]
  },
  { path: '**', redirectTo: 'login' }
];

