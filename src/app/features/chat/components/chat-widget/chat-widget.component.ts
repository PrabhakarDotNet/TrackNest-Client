import {
  Component, OnInit, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChatService, ChatMessage, ExpenseContext, ExtractedExpense } from '../../services/chat.service';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { ExpenseService } from '../../../../features/expense/services/expense.service';
import { Expense } from '../../../../features/expense/models/expense.model';
import { switchMap, of } from 'rxjs';

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
  isVisible = false;        // ✅ controls visibility on auth pages
  userInput = '';
  isLoading = false;
  sessionId = '';
  private shouldScroll = false;
  private expenses: Expense[] = [];
  pendingExpense: ExtractedExpense | null = null;
  showConfirmCard = false;

  private readonly authRoutes = ['/login', '/register'];

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
    private cdr: ChangeDetectorRef,
    private router: Router              // ✅ injected
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    this.sessionId = userId ? `user-${userId}` : `guest-${Date.now()}`;
    this.loadExpenses();

    // ✅ Check visibility on initial load
    this.isVisible = !this.authRoutes.includes(this.router.url);

    // ✅ Re-check on every route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isVisible = !this.authRoutes.includes(event.urlAfterRedirects);
      if (!this.isVisible) this.isOpen = false; // close if navigated to auth page
      this.cdr.detectChanges();
    });
  }

  private loadExpenses(): void {
    this.expenseService.getMyExpenses().subscribe({
      next: (data: Expense[]) => {
        this.expenses = data;
        console.log('[ChatWidget] Loaded expenses:', data.length);
      },
      error: (err) => {
        console.error('[ChatWidget] Failed to load expenses:', err);
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
      this.loadExpenses();
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

    this.chatService.extractExpense(message).pipe(
      switchMap((extracted: ExtractedExpense) => {

        if (extracted.found && extracted.amount > 0) {
          this.pendingExpense = extracted;
          this.showConfirmCard = true;
          this.isLoading = false;
          this.shouldScroll = true;
          this.cdr.detectChanges();
          return of(null);
        }

        return this.expenseService.getMyExpenses().pipe(
          switchMap((freshExpenses: Expense[]) => {
            this.expenses = freshExpenses;

            const expenseContext: ExpenseContext[] = freshExpenses.map(e => ({
              description: e.description,
              amount: e.amount,
              category: e.category,
              expenseDate: e.expenseDate ?? ''
            }));

            return this.chatService.sendMessage({
              session_id: this.sessionId,
              message,
              expenses: expenseContext
            });
          })
        );
      })
    ).subscribe({
      next: (response) => {
        if (!response) return;
        this.messages = [...this.messages, {
          role: 'bot',
          content: response.reply,
          timestamp: new Date()
        }];
        this.isLoading = false;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ChatWidget] sendMessage error:', err);
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

  confirmExpense(): void {
  if (!this.pendingExpense) return;

  const payload = {
    description: this.pendingExpense.description,
    amount: this.pendingExpense.amount,
    category: this.pendingExpense.category,
    expenseDate: this.pendingExpense.expenseDate
  };

  this.expenseService.addExpense(payload).subscribe({
    next: () => {
      this.showConfirmCard = false;
      this.messages = [...this.messages, {
        role: 'bot',
        content: `✅ Got it! **₹${payload.amount}** for **${payload.description}** added successfully!`,
        timestamp: new Date()
      }];
      this.pendingExpense = null;
      this.loadExpenses();
      this.expenseService.triggerRefresh();   // ✅ notify expense list
      this.shouldScroll = true;
      this.cdr.detectChanges();
    },
    error: () => {
      this.messages = [...this.messages, {
        role: 'bot',
        content: '❌ Failed to save expense. Please try again.',
        timestamp: new Date()
      }];
      this.showConfirmCard = false;
      this.pendingExpense = null;
      this.cdr.detectChanges();
    }
  });
}

  cancelExpense(): void {
    this.showConfirmCard = false;
    this.pendingExpense = null;
    this.messages = [...this.messages, {
      role: 'bot',
      content: 'No problem! Let me know if you need anything else.',
      timestamp: new Date()
    }];
    this.shouldScroll = true;
    this.cdr.detectChanges();
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