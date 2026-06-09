import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add access token to request if available and enable sending cookies.
    const accessToken = this.authService.getAccessToken();
    if (accessToken) {
      request = this.addTokenToRequest(request, accessToken);
    } else {
      request = request.clone({ withCredentials: true });
    }

    console.log('AuthInterceptor request', {
      url: request.url,
      auth: request.headers.get('Authorization'),
      withCredentials: request.withCredentials
    });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized
        if (error.status === 401 && !this.isTokenRefreshRequest(request)) {
          return this.handleUnauthorized(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
  }

  private handleUnauthorized(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          const newAccessToken = response?.accessToken ?? response?.AccessToken;
          console.log('AuthInterceptor refreshed token', newAccessToken);
          this.refreshTokenSubject.next(newAccessToken);

          // Retry the original request with new token
          return next.handle(this.addTokenToRequest(request, newAccessToken));
        }),
        catchError((error: any) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for token refresh to complete, then retry
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addTokenToRequest(request, token));
        })
      );
    }
  }

  private isTokenRefreshRequest(request: HttpRequest<any>): boolean {
    return request.url.includes('/auth/refresh');
  }
}
