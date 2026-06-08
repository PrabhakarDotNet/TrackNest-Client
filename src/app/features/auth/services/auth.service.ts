import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  login(email: string, password: string): Observable<boolean> {
    // Replace this stub with real API integration.
    return of(true).pipe(delay(300));
  }

  signup(name: string, email: string, password: string): Observable<boolean> {
    // Replace this stub with real API integration.
    return of(true).pipe(delay(300));
  }
}
