import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { SignupComponent } from './features/auth/components/signup/signup.component';
import { authGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './core/layout/app-layout/app-layout.component';
import { ExpenseDashboardComponent } from './features/dashboard/expense-dashboard.component';
import { ExpenseListComponent } from './features/expense/components/expense-list/expense-list.component';
import { ChatWidgetComponent } from './features/chat/components/chat-widget/chat-widget.component';
import { AnalyticsComponent } from './features/analytics/analytics/analytics.component';
import { CategoriesComponent } from './features/categories/categories/categories.component';
import { SettingsComponent } from './features/settings/settings/settings.component';


export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: ExpenseDashboardComponent },
      { path: 'expenses', component: ExpenseListComponent },
      { path: 'ai-assistant', component: ChatWidgetComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];