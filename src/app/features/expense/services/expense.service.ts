import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  private apiUrl = `${environment.apiUrl}/api/Expenses`;

  constructor(private http: HttpClient) {}

  // No manual auth headers needed — AuthInterceptor handles this automatically

  getAll(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.apiUrl);
  }

  getMyExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/my-expenses`);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  create(expense: Expense): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, expense);
  }

  update(id: number, expense: Expense): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, expense);
  }
}