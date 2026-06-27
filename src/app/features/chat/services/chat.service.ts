import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface ExpenseContext {
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  expenses?: ExpenseContext[];
}

export interface ChatResponse {
  reply: string;
  session_id: string;
}

export interface ExtractedExpense {
  found: boolean;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  confidence: string;
}

export interface IngestRequest {
  user_id: string;
}

export interface IngestResponse {
  ingested: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = environment.aiApiUrl; // e.g. https://tracknest-fastapi-...azurewebsites.net

  constructor(private http: HttpClient) {}

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, request);
  }

  extractExpense(message: string): Observable<ExtractedExpense> {
    return this.http.post<ExtractedExpense>(`${this.baseUrl}/extract-expense`, {
      description: message
    });
  }

  // Triggers ChromaDB re-index for this user in the background.
  // FastAPI runs it as a BackgroundTask so this returns near-instantly.
  // Safe to fire-and-forget: .subscribe() with no handlers.
  ingestExpenses(userId: string): Observable<IngestResponse> {
    return this.http.post<IngestResponse>(`${this.baseUrl}/ingest`, {
      user_id: userId
    } as IngestRequest);
  }
}