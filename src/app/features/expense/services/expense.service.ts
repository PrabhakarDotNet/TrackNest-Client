import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  private apiUrl = `${environment.apiUrl}/api/Expenses`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private createAuthHeaders(): { headers: HttpHeaders; withCredentials: true } {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
    return { headers, withCredentials: true };
  }

  getAll(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.apiUrl, this.createAuthHeaders());
  }

  getMyExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/my-expenses`, this.createAuthHeaders());
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.createAuthHeaders());
  }

  create(expense: Expense): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, expense, this.createAuthHeaders());
  }

  update(id: number, expense: Expense): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, expense, this.createAuthHeaders());
  }
}