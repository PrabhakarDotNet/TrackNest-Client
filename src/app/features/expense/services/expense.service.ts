import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  private apiUrl = 'https://localhost:7090/api/Expenses'; // change to your .NET API

  constructor(private http: HttpClient) {}

  getAll(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.apiUrl);
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