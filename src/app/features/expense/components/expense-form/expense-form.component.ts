import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnChanges {
  @Output() saved = new EventEmitter<void>();
  @Input() expenseInput: Expense | null = null;

  aiSuggested = false;

  readonly categories = [
    'Food & Dining',
    'Transport',
    'Shopping',
    'Health',
    'Bills & Utilities',
    'Entertainment',
    'Sports & Fitness',
    'Education',
    'Other'
  ];

  private readonly categoryRules: Record<string, string[]> = {
    'Food & Dining': ['lunch','dinner','breakfast','restaurant','cafe','pizza','burger','tea','coffee','snack','meal','grocery','vegetables','fruit','sweets'],
    'Transport': ['petrol','diesel','uber','ola','auto','taxi','bus','train','metro','fuel','cab','rickshaw','flight','ticket'],
    'Sports & Fitness': ['carrom','cricket','football','badminton','gym','sports','fitness','yoga','cycling','swimming','chess'],
    'Health': ['medicine','doctor','hospital','pharmacy','clinic','tablet','injection','checkup','medical'],
    'Shopping': ['shirt','shoes','clothes','amazon','flipkart','mobile','laptop','watch','bag'],
    'Entertainment': ['movie','netflix','hotstar','youtube','concert','show','spotify','music'],
    'Bills & Utilities': ['electricity','wifi','internet','rent','water','gas','recharge','insurance','emi'],
    'Education': ['book','course','fee','tuition','school','college','coaching'],
  };

  expense: Expense = {
    id: 0,
    amount: null as any,
    category: '',
    description: '',
    expenseDate: new Date().toISOString().slice(0, 10)
  };

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService
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
    const val = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.aiSuggested = false;
    if (!val || val.length < 3) return;
    for (const [category, keywords] of Object.entries(this.categoryRules)) {
      if (keywords.some(k => val.includes(k))) {
        this.expense.category = category;
        this.aiSuggested = true;
        break;
      }
    }
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

    this.expense.userId = userId;

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

  resetForm() {
    this.expense = {
      id: 0,
      amount: null as any,
      category: '',
      description: '',
      expenseDate: new Date().toISOString().slice(0, 10)
    };
    this.aiSuggested = false;
  }
}