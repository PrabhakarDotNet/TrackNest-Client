# TrackNest.Client (Angular)

## Overview

This repository contains the Angular client for TrackNest. The Angular side is implemented as a standalone application using Angular 21, with an auth-enabled expense dashboard and expense management workflow.

> This README documents only the Angular/client-side implementation. The backend/api is not included here.

## What was built

- Standalone root application with `App` component and router outlet.
- Authentication flow with login, signup, and protected routes.
- HTTP interceptor for attaching bearer tokens and supporting refresh tokens.
- Expense dashboard showing user-specific expense statistics and charts.
- Expense list page with create, edit, and delete operations.
- Navbar that updates based on authentication state.

## Angular features used

- Angular 21 standalone components
- `RouterOutlet` and route guards for protected pages
- `provideRouter`, `provideHttpClient`, and global providers in `app.config.ts`
- `HttpInterceptor` for auth token handling
- `signal` in `src/app/app.ts` for reactive app title state
- `localStorage` token storage for access tokens
- `withCredentials: true` for secure auth requests

## Key pages and routes

- `/login` - login page
- `/signup` - signup page
- `/dashboard` - expense dashboard (protected)
- `/expenses` - expense list page (protected)
- `/` redirects to dashboard when authenticated
- `**` redirects to `login`

## Auth flow

- `AuthService` handles login, signup, token storage, refresh token flow, and user profile management.
- `AuthInterceptor` adds the stored bearer token to outgoing requests.
- `AuthGuardService` protects dashboard and expense pages.
- Navbar shows login/signup links when unauthenticated and logout plus username when authenticated.

## Expense management

- `ExpenseService` performs CRUD operations against the API.
- `ExpenseListComponent` loads and displays the current user’s expenses.
- Expense form is shown in a Bootstrap modal for add/edit actions.
- Delete operations require confirmation.
- `ExpenseDashboardComponent` aggregates expenses into totals, averages, counts, and chart data.

## Important files

- `src/app/app.ts` — standalone root component
- `src/app/app.routes.ts` — client-side route definitions
- `src/app/app.config.ts` — router, HTTP client, and interceptor providers
- `src/app/features/auth/services/auth.service.ts` — authentication service
- `src/app/features/auth/interceptors/auth.interceptor.ts` — HTTP auth interceptor
- `src/app/features/auth/guards/auth.guard.ts` — auth guard for protected routes
- `src/app/features/expense/services/expense.service.ts` — expense API service
- `src/app/pages/expense-dashboard/expense-dashboard.component.ts` — dashboard page
- `src/app/features/expense/components/expense-list/expense-list.component.ts` — expense list page

## Local development

Run the Angular app locally:

```bash
npm install
npm start
```

Then open `http://localhost:4200`.

## Notes

- API URLs are currently configured to `https://localhost:7090` and should be updated to match the backend environment.
- Refresh token support is expected to use an HTTP-only cookie from the backend.
- This project uses Bootstrap for styling and modals.
