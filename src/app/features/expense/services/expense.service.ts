import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Expense } from '../models/expense.model';
import { environment } from '../../../../environments/environment';

export interface PagedExpenseResponse {
  items: Expense[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  private apiUrl = `${environment.apiUrl}/Expenses`;

  private refreshTrigger = new Subject<void>();
  refresh$ = this.refreshTrigger.asObservable();
  private searchTermSource = new Subject<string>();
searchTerm$ = this.searchTermSource.asObservable();

  constructor(private http: HttpClient) {}

  triggerRefresh(): void {
    this.refreshTrigger.next();
  }

  setSearchTerm(term: string): void {
  this.searchTermSource.next(term);
  }
  
  getMyExpenses(
    page = 1,
    pageSize = 5,
    sortBy = 'expenseDate',
    sortDirection: 'asc' | 'desc' = 'desc',
    search?: string
  ): Observable<PagedExpenseResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedExpenseResponse>(`${this.apiUrl}/my-expenses`, { params });
  }

  create(expense: Omit<Expense, 'id' | 'userId'>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, expense);
  }

  update(id: number, expense: Expense): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, expense);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}