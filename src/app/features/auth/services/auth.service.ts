import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface UserProfile {
  id: number;
  username: string;
  email: string;
}

interface AuthResponse {
  accessToken: string;
  user?: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/UserProfile`;
  private authUrl = `${environment.apiUrl}/api/Auth`;
  private currentUserKey = 'tracknest-current-user';
  private accessTokenKey = 'tracknest-access-token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          if (response?.accessToken) {
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
    return this.http
      .post<AuthResponse>(`${this.authUrl}/signup`, { username, email, password })
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

  setAccessToken(accessToken: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response?.accessToken) {
            this.setAccessToken(response.accessToken);
          }
        }),
        catchError((error) => {
          console.error('Token refresh failed', error);
          this.logout();
          return of().pipe(map(() => { throw error; }));
        })
      );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
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
    return this.getCurrentUser()?.id ?? null;
  }

  logout(): void {
    this.clearTokens();
    localStorage.removeItem(this.currentUserKey);
  }
}