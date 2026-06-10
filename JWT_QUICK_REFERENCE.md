# JWT + Refresh Token - Quick Reference Guide

## 📁 Files Changed/Created

| File | Action | Purpose |
|------|--------|---------|
| `auth.service.ts` | ✏️ Updated | Token storage & refresh logic |
| `auth.interceptor.ts` | ✨ Created | Attach tokens & handle 401 |
| `auth.guard.ts` | ✨ Created | Protect routes |
| `navbar.component.ts` | ✨ Created | User info & logout button |
| `app.config.ts` | ✏️ Updated | Register interceptor |
| `app.routes.ts` | ✏️ Updated | Add guard to routes |

---

## 🔑 Key Methods in AuthService

```typescript
// Store tokens after login
setTokens(accessToken: string, refreshToken: string)

// Get access token for API calls
getAccessToken(): string | null

// Get refresh token for refresh endpoint
getRefreshToken(): string | null

// Clear all tokens on logout
clearTokens(): void

// Check if user is authenticated
isAuthenticated(): boolean

// Refresh access token on 401
refreshToken(): Observable<AuthResponse>

// Logout user
logout(): void
```

---

## 🚀 Integration Checklist

### Step 1: Verify Backend Endpoints
```
✓ POST /auth/login → returns { accessToken, refreshToken, user? }
✓ POST /auth/signup → returns { accessToken, refreshToken, user? }
✓ POST /auth/refresh → returns { accessToken, refreshToken }
```

### Step 2: Add Navbar to App
```typescript
// app.ts
import { NavbarComponent } from './features/auth/components/navbar/navbar.component';

@Component({
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, ...others],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
```

### Step 3: Test the Flow
```
1. Navigate to /login
2. Enter credentials and click Login
3. Should redirect to /expenses
4. Check localStorage for tokens
5. Click Logout
6. Should redirect to /login
7. Try accessing /expenses directly
8. Should redirect to /login (protected)
```

---

## 💡 How Each Component Works

### AuthService - Token Management
```typescript
// After login API call:
login() → API returns tokens → setTokens() → stored in localStorage

// On every API call:
Interceptor reads token → adds to Authorization header

// On 401 error:
Interceptor → calls refreshToken() → gets new tokens → 
setTokens() → retries request
```

### HTTP Interceptor - Token Injection & Refresh
```typescript
// On every request:
1. Read accessToken from storage
2. If exists → add Authorization: Bearer [token]
3. If request returns 401 → 
   a. Call refreshToken() if not already refreshing
   b. Store new tokens
   c. Retry original request
   d. If refresh fails → logout
```

### Auth Guard - Route Protection
```typescript
// Before entering protected route:
isAuthenticated()? → YES → Allow entry
                  → NO → Redirect to /login
```

---

## 📊 Storage Structure

### localStorage Keys:
```
tracknest-access-token    → JWT access token
tracknest-refresh-token   → Refresh token
tracknest-current-user    → { id, username, email }
```

---

## 🔄 Token Refresh Flow (Visual)

```
Request with expired token
         ↓
    API returns 401
         ↓
  Check if refreshing?
    ↙️        ↘️
  NO          YES
   ↓           ↓
Call       Wait for
refresh    refresh
   ↓           ↓
   └─────┬─────┘
         ↓
  New token received
         ↓
   Store in localStorage
         ↓
   Retry original request
         ↓
   Return to component
```

---

## ⚙️ Environment Configuration

Update these in `auth.service.ts`:

```typescript
// Backend API URL
private authUrl = 'https://localhost:7090/api/Auth';

// Token storage keys
private accessTokenKey = 'tracknest-access-token';
private refreshTokenKey = 'tracknest-refresh-token';
```

---

## 🛡️ Security Notes

✅ **Implemented:**
- Tokens stored in localStorage
- Auto-attached to API requests
- Auto-refresh on expiry
- Logout clears all tokens

⚠️ **Consider for Production:**
- Use httpOnly cookies instead of localStorage
- Set token expiry times on backend
- Implement HTTPS only
- Add CORS headers

---

## 🧪 Testing Scenarios

| Scenario | Expected Outcome |
|----------|------------------|
| Valid login | Tokens stored, redirected to /expenses |
| Invalid credentials | Error message, stay on /login |
| Access protected route | If token exists → allow, else → redirect |
| Logout | Tokens cleared, redirected to /login |
| 401 on API call | Auto-refresh → retry request |
| Refresh fails | Logout, redirect to /login |
| Token in header | Authorization: Bearer [token] |

---

## 📞 API Response Examples

### Login Success
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Refresh Token Success
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Tokens not in header | Check interceptor in app.config.ts |
| 401 loop | Verify refresh endpoint works, check refresh token validity |
| Not redirected to login | Ensure guard is on route, verify isAuthenticated() |
| localStorage empty | Check login response has tokens |
| Navbar not showing user | Import NavbarComponent in app.ts |

---

## ✅ All Done!

Your Angular app now has:
- ✔️ JWT token storage
- ✔️ Automatic token attachment to requests
- ✔️ Automatic token refresh on 401
- ✔️ Route protection with auth guard
- ✔️ User logout
- ✔️ User info display

Just update your backend API URLs and test!
