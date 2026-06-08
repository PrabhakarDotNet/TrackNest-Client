import { Routes } from '@angular/router';
import { ExpenseDashboardComponent } from './pages/expense-dashboard/expense-dashboard.component';
import { ExpenseListComponent } from './features/expense/components/expense-list/expense-list.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { SignupComponent } from './features/auth/components/signup/signup.component';

export const routes: Routes = [
  { path: '', component: ExpenseDashboardComponent },
  { path: 'dashboard', component: ExpenseDashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'expenses', component: ExpenseListComponent },
  { path: '**', redirectTo: '' }
];
