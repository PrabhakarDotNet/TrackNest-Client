import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ExpenseContext } from '../../services/chat.service';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { Expense } from '../../../../features/expense/models/expense.model';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  @Input() expenses: Expense[] = [];
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isLoading = false;
  sessionId = '';

  messages: ChatMessage[] = [
    {
      role: 'bot',
      content: 'Hi! I\'m your TrackNest AI assistant 🤖 Ask me anything about your expenses!',
      timestamp: new Date()
    }
  ];

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    this.sessionId = userId ? `user-${userId}` : `guest-${Date.now()}`;
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    const message = this.userInput.trim();
    if (!message || this.isLoading) return;

    this.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    this.userInput = '';
    this.isLoading = true;

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
        this.messages.push({
          role: 'bot',
          content: response.reply,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: () => {
        this.messages.push({
          role: 'bot',
          content: 'Sorry, I could not connect to the AI service. Please try again.',
          timestamp: new Date()
        });
        this.isLoading = false;
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