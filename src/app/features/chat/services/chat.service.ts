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

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.aiApiUrl}/chat`;

  constructor(private http: HttpClient) {}

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, request);
  }
}