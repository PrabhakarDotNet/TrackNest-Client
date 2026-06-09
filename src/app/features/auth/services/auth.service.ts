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
  AccessToken: string;
  RefreshToken?: string;
  User?: UserProfile;
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
      .post<AuthResponse>(`${this.authUrl}/login`, { username, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          const accessToken = response?.AccessToken ?? (response as any)?.accessToken;
          const user = response?.User ?? (response as any)?.user;

          if (accessToken) {
            this.setAccessToken(accessToken);
            if (user) {
              this.setCurrentUser(user);
            }
          }
        }),
        map((response) => !!(response?.AccessToken ?? (response as any)?.accessToken)),
        catchError(() => of(false))
      );
  }

  signup(username: string, email: string, password: string): Observable<boolean> {
    const payload = { username, email, password };
    return this.http
      .post<AuthResponse>(`${this.authUrl}/signup`, payload, { withCredentials: true })
      .pipe(
        tap((response) => {
          const accessToken = response?.AccessToken ?? (response as any)?.accessToken;
          const user = response?.User ?? (response as any)?.user;

          if (accessToken) {
            this.setAccessToken(accessToken);
            if (user) {
              this.setCurrentUser(user);
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
      .post<AuthResponse>(`${this.authUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          const accessToken = response?.AccessToken ?? (response as any)?.accessToken;
          if (accessToken) {
            this.setAccessToken(accessToken);
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

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`, { withCredentials: true });
  }

  loadProfile(): Observable<boolean> {
    return this.getProfile().pipe(
      tap((user) => this.setCurrentUser(user)),
      map(() => true),
      catchError((error) => {
        console.error('Failed to load profile', error);
        return of(false);
      })
    );
  }

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
