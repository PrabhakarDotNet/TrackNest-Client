import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Expense } from '../../models/expense.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnChanges {
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Input() expenseInput: Expense | null = null;

  aiSuggested = false;
  aiLoading = false;
  private debounceTimer: any;

  readonly categories = [
    'Food & Dining',
    'Transport',
    'Shopping',
    'Health',
    'Bills & Utilities',
    'Entertainment',
    'Sports & Fitness',
    'Education',
    'Investment',
    'Other'
  ];

  expense: Expense = {
    id: 0,
    amount: null as any,
    category: '',
    description: '',
    expenseDate: new Date().toISOString().slice(0, 10)
  };

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['expenseInput']) {
      const val: Expense | null = changes['expenseInput'].currentValue;
      if (val) {
        this.expense = { ...val };
        this.aiSuggested = false;
        if (this.expense.expenseDate) {
          try {
            this.expense.expenseDate = new Date(this.expense.expenseDate).toISOString().slice(0, 10);
          } catch {
            // ignore parse errors
          }
        }
      } else {
        this.resetForm();
      }
    }
  }

  onDescriptionInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim();
    this.aiSuggested = false;

    if (!val || val.length < 3) return;

    // debounce — wait 600ms after user stops typing
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.suggestCategory(val);
    }, 600);
  }

  private suggestCategory(description: string): void {
    this.aiLoading = true;
    this.http.post<{ category: string }>(
      `${environment.aiApiUrl}/suggest-category`,
      { description }
    ).subscribe({
      next: (response) => {
        this.expense.category = response.category;
        this.aiSuggested = true;
        this.aiLoading = false;
      },
      error: () => {
        this.aiLoading = false;
      }
    });
  }

  saveExpense() {
    if (this.expense.expenseDate) {
      this.expense.expenseDate = new Date(this.expense.expenseDate).toISOString();
    }

    const userId = this.authService.getCurrentUserId();
    if (userId === null) {
      console.error('Cannot save expense: no authenticated user.');
      return;
    }

    this.expense.userId = userId ? parseInt(userId) : 0;

    if (this.expense.id && this.expense.id > 0) {
      this.expenseService.update(this.expense.id, this.expense).subscribe({
        next: () => {
          this.resetForm();
          this.saved.emit();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.expenseService.create(this.expense).subscribe({
        next: () => {
          this.resetForm();
          this.saved.emit();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelExpense(): void {
    this.resetForm();
    this.cancel.emit();
  }

  resetForm() {
    this.expense = {
      id: 0,
      amount: null as any,
      category: '',
      description: '',
      expenseDate: new Date().toISOString().slice(0, 10)
    };
    this.aiSuggested = false;
    this.aiLoading = false;
  }
}