import {
  Component, OnInit, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ExpenseContext } from '../../services/chat.service';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { ExpenseService } from '../../../../features/expense/services/expense.service'; // ✅ import
import { Expense } from '../../../../features/expense/models/expense.model';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isLoading = false;
  sessionId = '';
  private shouldScroll = false;
  private expenses: Expense[] = [];
  messages: ChatMessage[] = [
    {
      role: 'bot',
      content: 'Hi! I\'m your TrackNest AI assistant 🤖 Ask me anything about your expenses!',
      timestamp: new Date()
    }
  ];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    this.sessionId = userId ? `user-${userId}` : `guest-${Date.now()}`;

   
   this.expenseService.getMyExpenses().subscribe({
  next: (data: Expense[]) => {
        this.expenses = data;
      },
      error: () => {
        this.expenses = [];
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
    }
  }

  sendMessage(): void {
    const message = this.userInput.trim();
    if (!message || this.isLoading) return;

    this.messages = [...this.messages, {
      role: 'user',
      content: message,
      timestamp: new Date()
    }];

    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    const expenseContext: ExpenseContext[] = this.expenses.map(e => ({
      description: e.description,
      amount: e.amount,
      category: e.category,
      expenseDate: e.expenseDate ?? ''
    }));

    this.chatService.sendMessage({
      session_id: this.sessionId,
      message,
      expenses: expenseContext
    }).subscribe({
      next: (response) => {
        this.messages = [...this.messages, {
          role: 'bot',
          content: response.reply,
          timestamp: new Date()
        }];
        this.isLoading = false;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages = [...this.messages, {
          role: 'bot',
          content: 'Sorry, I could not connect to the AI service. Please try again.',
          timestamp: new Date()
        }];
        this.isLoading = false;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '• $1')
      .replace(/\n/g, '<br>');
  }
}