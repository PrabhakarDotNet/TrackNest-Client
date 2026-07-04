import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { switchMap, catchError, filter, take } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isAuthUrl(req.url)) {
      return next.handle(req);
    }

    // PROACTIVE: Access token expired → refresh before sending
    // Removed getRefreshToken() check — cookie is managed by browser, always present if set
    if (this.authService.isTokenExpired()) {
      return this.refreshAndRetry(req, next);
    }

    // NORMAL: Attach token
    const token = this.authService.getAccessToken();
    if (token) {
      req = this.addToken(req, token);
    }

    // REACTIVE: Handle 401 (edge cases e.g. token revoked server-side)
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/refresh')) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private refreshAndRetry(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token!)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshAccessToken().pipe(
      switchMap((res: any) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(res.accessToken);
        return next.handle(this.addToken(req, res.accessToken));
      }),
      catchError((err) => {
        this.isRefreshing = false;
        // logout() already called inside refreshAccessToken() on failure
        return throwError(() => err);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      return this.refreshAndRetry(req, next);
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(req, token!)))
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      withCredentials: true,                          // ← ADDED: sends HttpOnly cookie
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private isAuthUrl(url: string): boolean {
  return url.includes('/auth/');
}
}