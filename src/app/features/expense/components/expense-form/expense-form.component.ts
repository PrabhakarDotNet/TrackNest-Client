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
export class ExpenseFormComponent {
  @Output() saved = new EventEmitter<void>();
  @Input() expenseInput: Expense | null = null;
  expense: Expense = {
    id: 0,
    amount: 0,
    category: '',
    description: '',
    expenseDate: ''   // keep as string
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
        if (this.expense.expenseDate) {
          // convert ISO datetime to yyyy-MM-dd for date input
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

  saveExpense() {
    // Ensure date is in ISO format before sending
    if (this.expense.expenseDate) {
      this.expense.expenseDate = new Date(this.expense.expenseDate).toISOString();
    }

    const userId = this.authService.getCurrentUserId();
    if (userId === null) {
      console.error('Cannot save expense: no authenticated user.');
      return;
    }

    this.expense.userId = userId;

    if (this.expense && this.expense.id && this.expense.id > 0) {
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
      amount: 0,
      category: '',
      description: '',
      expenseDate: ''
    };
  }
}
