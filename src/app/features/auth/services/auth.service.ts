import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, filter, take, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly USER_KEY = 'current_user';

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() >= parseInt(expiry) - 30000;
  }

  private saveSession(accessToken: string, expiresIn: number): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, (Date.now() + expiresIn * 1000).toString());
  }

  private saveUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getCurrentUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  getCurrentUserId(): string | null {
    return this.getCurrentUser()?.id ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/auth/login`, credentials, {
        withCredentials: true
      })
      .pipe(
        tap((res: any) => {
          this.saveSession(res.accessToken, res.expiresIn);
          if (res.user) this.saveUser(res.user);
        })
      );
  }

  signup(username: string, email: string, password: string): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/auth/signup`, { username, email, password }, {
        withCredentials: true
      })
      .pipe(
        tap(res => console.log('AuthService.signup -> response:', res)),
        catchError(err => {
          console.error('AuthService.signup -> error:', err);
          return throwError(() => err);
        })
      );
  }

  googleLogin(idToken: string): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/auth/google-login`, { idToken }, {
        withCredentials: true
      })
      .pipe(
        tap((res: any) => {
          this.saveSession(res.accessToken, res.expiresIn ?? 3600);
          if (res.user) this.saveUser(res.user);
        }),
        catchError(err => {
          console.error('AuthService.googleLogin -> error:', err);
          return throwError(() => err);
        })
      );
  }

  refreshAccessToken(): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/auth/refresh`, {}, {
        withCredentials: true
      })
      .pipe(
        tap((res: any) => {
          this.saveSession(res.accessToken, res.expiresIn);
          this.refreshTokenSubject.next(res.accessToken);
        }),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  handleTokenRefresh(): Observable<string> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1)
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.refreshAccessToken().pipe(
      switchMap((res: any) => {
        this.isRefreshing = false;
        return [res.accessToken];
      }),
      catchError((err) => {
        this.isRefreshing = false;
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} });

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }
}