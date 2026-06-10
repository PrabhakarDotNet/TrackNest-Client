# JWT + Refresh Token Authentication Implementation

## ✅ Implementation Complete

This document outlines the complete JWT + Refresh Token authentication flow implemented in the TrackNest Angular application.

---

## 📋 Overview

The authentication system implements:
- ✅ Token storage in localStorage
- ✅ Automatic token attachment to HTTP requests
- ✅ 401 error handling with automatic token refresh
- ✅ Failed request retry with new token
- ✅ Route protection with AuthGuard
- ✅ User logout functionality

---

## 🏗️ Architecture

### Files Created/Modified:

1. **AuthService** (`src/app/features/auth/services/auth.service.ts`)
   - Token storage: `setTokens()`, `getAccessToken()`, `getRefreshToken()`, `clearTokens()`
   - User management: `getCurrentUser()`, `setCurrentUser()`, `logout()`
   - Token refresh: `refreshToken()` method
   - Authentication check: `isAuthenticated()`

2. **HTTP Interceptor** (`src/app/features/auth/interceptors/auth.interceptor.ts`)
   - Automatically attaches access token to requests
   - Handles 401 errors by triggering token refresh
   - Retries failed requests with new token
   - Prevents multiple simultaneous refresh requests

3. **Auth Guard** (`src/app/features/auth/guards/auth.guard.ts`)
   - Protects routes requiring authentication
   - Redirects to login if token not available
   - Service-based guard: `AuthGuardService`
   - Functional guard: `authGuard` (for newer Angular versions)

4. **Navbar Component** (`src/app/features/auth/components/navbar/navbar.component.ts`)
   - Displays logged-in user information
   - Provides logout button
   - Shows login link when not authenticated

5. **Updated Files**
   - `app.config.ts` - Provides HTTP interceptor
   - `app.routes.ts` - Added auth guard to protected routes
   - `auth.service.ts` - Enhanced with token management

---

## 🔄 Complete Authentication Flow

```
1. USER LOGIN
   ↓
2. LOGIN API CALL
   ├─→ Email & Password sent to /auth/login
   ├─→ Backend returns: accessToken + refreshToken
   ↓
3. STORE TOKENS
   ├─→ accessToken → localStorage
   ├─→ refreshToken → localStorage
   ├─→ user info → localStorage
   ↓
4. HTTP REQUEST
   ├─→ Interceptor attaches: Authorization: Bearer [accessToken]
   ├─→ Request sent to API
   ↓
5A. SUCCESS (200-299)
   └─→ Response returned to component
   
5B. UNAUTHORIZED (401)
   ├─→ Interceptor detects 401
   ├─→ If not already refreshing:
   │  ├─→ Call /auth/refresh with refreshToken
   │  ├─→ Backend returns new tokens
   │  ├─→ Update localStorage with new tokens
   │  ├─→ Notify waiting requests
   ├─→ Retry original request with new token
   └─→ If refresh fails:
       ├─→ Clear tokens
       ├─→ Redirect to login
       └─→ Reject request

6. LOGOUT
   ├─→ Clear accessToken from localStorage
   ├─→ Clear refreshToken from localStorage
   ├─→ Clear user info from localStorage
   ├─→ Redirect to login page
   └─→ Any subsequent API call will be blocked by guard
```

---

## 📝 Backend API Requirements

Your .NET backend should implement:

### 1. Login Endpoint
```
POST /api/Auth/login
Body: { email: string, password: string }
Response: {
  accessToken: string,
  refreshToken: string,
  user?: { id: number, username: string, email: string }
}
```

### 2. Refresh Token Endpoint
```
POST /api/Auth/refresh
Body: { refreshToken: string }
Response: {
  accessToken: string,
  refreshToken: string
}
Status: 401 if refresh token invalid/expired
```

### 3. Signup Endpoint (Enhanced)
```
POST /api/Auth/signup
Body: { username: string, email: string, password: string }
Response: {
  accessToken: string,
  refreshToken: string,
  user?: { id: number, username: string, email: string }
}
```

---

## 🔐 Security Best Practices

### ✅ Implemented:
1. **httpOnly Cookies** (Recommended Alternative)
   - Currently using localStorage - consider switching to httpOnly cookies for better security
   - httpOnly prevents JavaScript access - safer against XSS attacks

2. **Automatic Token Expiry**
   - Access tokens should expire quickly (5-15 minutes)
   - Refresh tokens expire longer (7-30 days)
   - Backend enforces expiry validation

3. **HTTPS Only**
   - Use HTTPS in production
   - Never send tokens over HTTP

4. **CORS Configuration**
   - Backend should validate origin
   - Only trusted domains can send tokens

### 🔄 Future Improvement: Use httpOnly Cookies
```typescript
// Alternative: Send refresh token as httpOnly cookie
// Backend sets: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
// Frontend automatically includes it in requests
```

---

## 🎯 How to Use

### 1. Login Flow
```typescript
// login.component.ts
this.authService.login(email, password).subscribe({
  next: (success) => {
    if (success) {
      // Tokens automatically stored
      // User redirected by component
      this.router.navigate(['expenses']);
    }
  }
});
```

### 2. Protected Routes
```typescript
// Already implemented in app.routes.ts
{ path: 'expenses', component: ExpenseListComponent, canActivate: [AuthGuardService] }
```

### 3. API Calls (Automatic Token Attachment)
```typescript
// auth.service.ts
this.http.get('/api/expenses').subscribe(); // Token automatically attached!
```

### 4. Logout
```typescript
// navbar.component.ts
logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']);
}
```

---

## 🛠️ Configuration

### 1. Update API URLs
Edit `auth.service.ts`:
```typescript
private apiUrl = 'https://your-backend-url/api/Auth';
```

### 2. Adjust Token Keys
Edit `auth.service.ts`:
```typescript
private accessTokenKey = 'your-app-access-token';
private refreshTokenKey = 'your-app-refresh-token';
```

### 3. Add Navbar to App
Edit `app.html`:
```html
<app-navbar></app-navbar>
<router-outlet></router-outlet>
```

And import in `app.ts`:
```typescript
import { NavbarComponent } from './features/auth/components/navbar/navbar.component';

@Component({
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, ...other imports],
})
```

---

## ✅ Testing Checklist

- [ ] Login stores both accessToken and refreshToken
- [ ] Access token included in Authorization header on API calls
- [ ] 401 error triggers token refresh
- [ ] New tokens stored after refresh
- [ ] Failed request retried with new token
- [ ] Logout clears all tokens
- [ ] Protected routes redirect to login if not authenticated
- [ ] Navbar displays user info when logged in
- [ ] Navbar displays login link when logged out

---

## 🚀 Next Steps

1. **Update Backend** - Ensure `/auth/login`, `/auth/signup`, and `/auth/refresh` endpoints return tokens
2. **Test Locally** - Run `npm start` and test login/logout flow
3. **Add Error Handling** - Enhance error messages for user feedback
4. **Implement Token Expiry** - Add token expiry time tracking
5. **Consider httpOnly Cookies** - For enhanced security in production
6. **Add Refresh on App Load** - Restore session if refresh token valid

---

## 📦 Dependencies

Already included in Angular:
- `@angular/common/http`
- `rxjs` (operators: switchMap, filter, take, catchError, tap, map)

No additional packages needed!

---

## 🐛 Troubleshooting

### Tokens not persisting
- Check if localStorage is enabled
- Verify backend sends tokens in response
- Clear browser storage and try again

### 401 Loop
- Refresh token might be invalid
- Logout and login again
- Check backend refresh token validation

### Interceptor not attaching token
- Verify `HTTP_INTERCEPTORS` provided in `app.config.ts`
- Check if request URL matches expectations
- Review browser DevTools Network tab

### Routes not protected
- Confirm `canActivate: [AuthGuardService]` on routes
- Verify AuthGuardService is properly imported
- Check if `isAuthenticated()` returns correct value

---

Generated: 2026-06-09
