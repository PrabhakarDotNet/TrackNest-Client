import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Expense } from '../../models/expense.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnChanges {
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Input() expenseInput: Expense | null = null;

  expenseForm: FormGroup;
  isSubmitting = false;
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

  currentExpenseId = 0;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.expenseForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      expenseDate: [new Date().toISOString().slice(0, 10), Validators.required],
      description: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/\S.*/)]],
      category: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['expenseInput']) {
      const val: Expense | null = changes['expenseInput'].currentValue;
      if (val) {
        this.currentExpenseId = val.id ?? 0;
        const dateValue = val.expenseDate ? this.formatDateInput(val.expenseDate) : new Date().toISOString().slice(0, 10);
        this.expenseForm.setValue({
          amount: val.amount ?? null,
          expenseDate: dateValue,
          description: val.description ?? '',
          category: val.category ?? ''
        });
        this.aiSuggested = false;
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
        this.expenseForm.get('category')?.setValue(response.category);
        this.aiSuggested = true;
        this.aiLoading = false;
      },
      error: () => {
        this.aiLoading = false;
      }
    });
  }

  saveExpense(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (userId === null) {
      console.error('Cannot save expense: no authenticated user.');
      return;
    }

    const formValue = this.expenseForm.value;
    const expense: Expense = {
      id: this.currentExpenseId,
      amount: Number(formValue.amount),
      category: formValue.category,
      description: formValue.description.trim(),
      expenseDate: new Date(formValue.expenseDate).toISOString(),
      userId: userId ? parseInt(userId) : 0
    };

    const request$: Observable<unknown> = this.currentExpenseId > 0
      ? this.expenseService.update(this.currentExpenseId, expense)
      : this.expenseService.create(expense);

    this.isSubmitting = true;

    request$.subscribe({
      next: () => {
        this.resetForm();
        this.saved.emit();
        this.isSubmitting = false;
      },
      error: (err: unknown) => {
        console.error(err);
        this.isSubmitting = false;
      }
    });
  }

  cancelExpense(): void {
    this.resetForm();
    this.cancel.emit();
  }

  resetForm() {
    this.currentExpenseId = 0;
    this.expenseForm.reset({
      amount: null,
      expenseDate: new Date().toISOString().slice(0, 10),
      description: '',
      category: ''
    });
    this.aiSuggested = false;
    this.aiLoading = false;
  }

  private formatDateInput(value: string): string {
    try {
      return new Date(value).toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }
}