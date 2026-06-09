import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

interface UserProfile {
  id: number;
  username: string;
  email: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user?: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7090/api/UserProfile'; // change to your .NET API
  private authUrl = 'https://localhost:7090/api/Auth'; // Auth endpoints
  private currentUserKey = 'tracknest-current-user';
  private accessTokenKey = 'tracknest-access-token';
  private refreshTokenKey = 'tracknest-refresh-token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          if (response?.accessToken) {
            console.log(response);
            this.setAccessToken(response.accessToken);
            if (response.user) {
              this.setCurrentUser(response.user);
            }
          }
        }),
        map((response) => !!response?.accessToken),
        catchError(() => of(false))
      );
  }

  signup(username: string, email: string, password: string): Observable<boolean> {
    const payload = { username, email, password };
    return this.http
      .post<AuthResponse>(`${this.authUrl}/signup`, payload)
      .pipe(
        tap((response) => {
          if (response?.accessToken) {
            this.setAccessToken(response.accessToken);
            if (response.user) {
              this.setCurrentUser(response.user);
            }
          }
        }),
        map(() => true),
        catchError((error) => {
          console.error('Signup failed', error.error ?? error);
          return of(false);
        })
      );
  }

  // ===== TOKEN MANAGEMENT =====

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    // refreshToken is httpOnly cookie - handled by browser automatically
  }

  setAccessToken(accessToken: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    // refreshToken is httpOnly cookie - cannot access from JavaScript
    // Browser sends it automatically with requests (withCredentials: true)
    return null;
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
    // refreshToken is httpOnly cookie - backend clears it on logout
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // ===== REFRESH TOKEN FLOW =====

  refreshToken(): Observable<AuthResponse> {
    // refreshToken is httpOnly cookie - browser sends it automatically
    // No need to pass it in the body
    return this.http
      .post<AuthResponse>(`${this.authUrl}/refresh`, {})
      .pipe(
        tap((response) => {
          if (response?.accessToken) {
            this.setAccessToken(response.accessToken);
          }
        }),
        catchError((error) => {
          console.error('Token refresh failed', error);
          this.logout();
          return of().pipe(
            map(() => {
              throw error;
            })
          );
        })
      );
  }

  // ===== USER MANAGEMENT =====

  setCurrentUser(user: UserProfile): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(this.currentUserKey);
    return raw ? JSON.parse(raw) : null;
  }

  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id ?? null;
  }

  logout(): void {
    this.clearTokens();
    localStorage.removeItem(this.currentUserKey);
  }
}
