import {
  Component, OnInit, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChatService, ChatMessage, ExpenseContext, ExtractedExpense } from '../../services/chat.service';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { ExpenseService, PagedExpenseResponse } from '../../../../features/expense/services/expense.service';
import { Expense } from '../../../../features/expense/models/expense.model';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  isVisible = false;
  userInputControl = new FormControl('', [Validators.required]);
  isLoading = false;
  sessionId = '';
  private shouldScroll = false;
  private expenses: Expense[] = [];

  pendingExpense: ExtractedExpense | null = null;
  showConfirmCard = false;

  // Guided flow state
  conversationStep: 'idle' | 'ask_amount' | 'ask_category' | 'ask_description' = 'idle';
  partialExpense: Partial<ExtractedExpense> = {};

  private readonly authRoutes = ['/login', '/register'];

  messages: ChatMessage[] = [
    {
      role: 'bot',
      content: 'Hi! I\'m your TrackNest AI assistant 🤖 Ask me anything about your expenses, or say something like "I spent ₹500 on dinner" and I\'ll help you add it!',
      timestamp: new Date()
    }
  ];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  private setLoading(flag: boolean): void {
    this.isLoading = flag;
    try {
      if (flag) {
        this.userInputControl.disable({ emitEvent: false });
      } else {
        this.userInputControl.enable({ emitEvent: false });
      }
    } catch {}
  }

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    this.sessionId = userId ? `user-${userId}` : `guest-${Date.now()}`;
    this.loadExpenses();

    this.isVisible = !this.authRoutes.includes(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isVisible = !this.authRoutes.includes(event.urlAfterRedirects);
      if (!this.isVisible) this.isOpen = false;
      this.cdr.detectChanges();
    });
  }

  private loadExpenses(): void {
  this.expenseService.getMyExpenses().subscribe({
    next: (data: PagedExpenseResponse) => {
      this.expenses = data.items; // 👈 important fix
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
      this.loadExpenses();
      this.shouldScroll = true;
    }
  }

  sendMessage(): void {
    const message = String(this.userInputControl.value || '').trim();
    if (!message || this.isLoading) return;

    this.messages = [...this.messages, {
      role: 'user',
      content: message,
      timestamp: new Date()
    }];
    this.userInputControl.reset('');
    this.shouldScroll = true;

    // If we are in a guided step, handle it locally — no API call needed
    if (this.conversationStep !== 'idle') {
      this.handleGuidedStep(message);
      return;
    }

    this.setLoading(true);

    this.chatService.extractExpense(message).pipe(
      switchMap((extracted: ExtractedExpense) => {

        if (extracted.found) {
          this.partialExpense = { ...extracted };
          this.setLoading(false);

          // Missing amount — ask first
          if (!extracted.amount || extracted.amount <= 0) {
            this.conversationStep = 'ask_amount';
            this.messages = [...this.messages, {
              role: 'bot',
              content: 'How much did you spend? (Enter the amount in ₹)',
              timestamp: new Date()
            }];
            this.shouldScroll = true;
            this.cdr.detectChanges();
            return of(null);
          }

          // Missing category — ask next
          if (!extracted.category) {
            this.conversationStep = 'ask_category';
            this.messages = [...this.messages, {
              role: 'bot',
              content: `Got it — ₹${extracted.amount}. What category does this fall under?\n• Food & Dining\n• Transport\n• Health\n• Bills & Utilities\n• Investment\n• Sports & Fitness\n• Petrol\n• Others`,
              timestamp: new Date()
            }];
            this.shouldScroll = true;
            this.cdr.detectChanges();
            return of(null);
          }

          // Missing description — ask last
          if (!extracted.description) {
            this.conversationStep = 'ask_description';
            this.messages = [...this.messages, {
              role: 'bot',
              content: `Got it — ${extracted.category}. Add a short description (or type "skip" to leave blank):`,
              timestamp: new Date()
            }];
            this.shouldScroll = true;
            this.cdr.detectChanges();
            return of(null);
          }

          // All fields present — show confirm card directly
          this.pendingExpense = extracted;
          this.showConfirmCard = true;
          this.shouldScroll = true;
          this.cdr.detectChanges();
          return of(null);
        }

        // Not an expense intent — send to AI for normal Q&A
       return this.expenseService.getMyExpenses().pipe(
  switchMap((res: PagedExpenseResponse) => {

    const freshExpenses: Expense[] = res.items;

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
        this.setLoading(false);
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages = [...this.messages, {
          role: 'bot',
          content: 'Sorry, I could not connect to the AI service. Please try again.',
          timestamp: new Date()
        }];
        this.setLoading(false);
        this.shouldScroll = true;
        this.cdr.detectChanges();
      }
    });
  }

  private handleGuidedStep(input: string): void {
    switch (this.conversationStep) {

      case 'ask_amount': {
        const amount = parseFloat(input.replace(/[₹,\s]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          this.messages = [...this.messages, {
            role: 'bot',
            content: 'Please enter a valid amount (e.g. 500 or ₹1200).',
            timestamp: new Date()
          }];
          this.shouldScroll = true;
          this.cdr.detectChanges();
          return;
        }
        this.partialExpense.amount = amount;
        this.conversationStep = 'ask_category';
        this.messages = [...this.messages, {
          role: 'bot',
          content: `Got it — ₹${amount}. What category does this fall under?\n(e.g. Food & Dining, Transport, Health, Bills & Utilities, Investment, Sports & Fitness, Others)`,
          timestamp: new Date()
        }];
        break;
      }

      case 'ask_category': {
        const validCategories = [
          'food & dining', 'transport', 'health', 'bills & utilities',
          'investment', 'sports & fitness', 'petrol', 'others'
        ];

        const inputLower = input.trim().toLowerCase();
        const matched = validCategories.find(c => inputLower.includes(c) || c.includes(inputLower));

        if (!matched) {
          this.messages = [...this.messages, {
            role: 'bot',
            content: `Please choose a valid category:\n• Food & Dining\n• Transport\n• Health\n• Bills & Utilities\n• Investment\n• Sports & Fitness\n• Petrol\n• Others`,
            timestamp: new Date()
          }];
          this.shouldScroll = true;
          this.cdr.detectChanges();
          return;
        }

        this.partialExpense.category = validCategories
          .find(c => c === matched)!
          .replace(/\b\w/g, l => l.toUpperCase());

        this.conversationStep = 'ask_description';
        this.messages = [...this.messages, {
          role: 'bot',
          content: `Got it — ${this.partialExpense.category}. Add a short description (or type "skip" to leave blank):`,
          timestamp: new Date()
        }];
        break;
      }

      case 'ask_description': {
        this.partialExpense.description =
          input.toLowerCase() === 'skip' ? '' : input.trim();
        this.conversationStep = 'idle';

        // All fields collected — show confirm card
        this.pendingExpense = this.partialExpense as ExtractedExpense;
        this.showConfirmCard = true;
        this.partialExpense = {};
        break;
      }
    }

    this.shouldScroll = true;
    this.cdr.detectChanges();
  }

  confirmExpense(): void {
    if (!this.pendingExpense) return;

    const payload: Omit<Expense, 'id' | 'userId'> = {
  description: this.pendingExpense.description ?? '',
  amount: this.pendingExpense.amount ?? 0,
  category: this.pendingExpense.category ?? '',
  expenseDate: this.pendingExpense.expenseDate?.trim() || new Date().toISOString()
};

   this.expenseService.create(payload).subscribe({
      next: () => {
        this.showConfirmCard = false;
        this.messages = [...this.messages, {
          role: 'bot',
          content: `✅ Got it! **₹${payload.amount}** for **${payload.description}** added successfully!`,
          timestamp: new Date()
        }];
        this.pendingExpense = null;
        this.loadExpenses();
        this.expenseService.triggerRefresh();

        // Fire-and-forget RAG re-index so ChromaDB stays in sync
        const userId = this.authService.getCurrentUserId();
        if (userId) {
          this.chatService.ingestExpenses(String(userId)).subscribe();
        }

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
    this.conversationStep = 'idle';
    this.partialExpense = {};
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