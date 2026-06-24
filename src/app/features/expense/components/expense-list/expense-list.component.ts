import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, ExpenseFormComponent],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  loading = true;
  selectedExpense: Expense | null = null;

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses() {
    this.loading = true;

    this.expenseService.getMyExpenses().subscribe({
      next: (data: Expense[]) => {
        this.expenses = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
        this.loading = false;
      }
    });
  }

  selectedDeleteId: number | null = null;
  selectedDeleteDescription = '';

  confirmDeleteExpense(id: number, description: string) {
    this.selectedDeleteId = id;
    this.selectedDeleteDescription = description || '';

    const modalEl = document.getElementById('confirmDeleteModal');
    if (!modalEl) return;

    const BsModal = (window as any).bootstrap?.Modal;
    if (!BsModal) return;

    const instance = BsModal.getInstance ? BsModal.getInstance(modalEl) ?? new BsModal(modalEl) : new BsModal(modalEl);
    instance.show();
  }

  confirmDelete() {
    if (this.selectedDeleteId === null) return;

    this.expenseService.delete(this.selectedDeleteId).subscribe({
      next: () => {
        this.loadExpenses();
        this.selectedDeleteId = null;
        this.selectedDeleteDescription = '';
        const modalEl = document.getElementById('confirmDeleteModal');
        if (modalEl) {
          const BsModal = (window as any).bootstrap?.Modal;
          if (BsModal) {
            const instance = BsModal.getInstance ? BsModal.getInstance(modalEl) ?? new BsModal(modalEl) : new BsModal(modalEl);
            instance.hide();
          }
        }
      },
      error: (err) => console.log(err)
    });
  }

  openAddExpenseForm()
  {
    this.selectedExpense = null;
    const modalEl = document.getElementById('addExpenseModal');
    if (!modalEl) return;

    const BsModal = (window as any).bootstrap?.Modal;
    if (!BsModal) return;

    const instance = BsModal.getInstance ? BsModal.getInstance(modalEl) ?? new BsModal(modalEl) : new BsModal(modalEl);
    instance.show();
  }

  openEditExpenseForm(exp: Expense) {
    this.selectedExpense = { ...exp };

    const modalEl = document.getElementById('addExpenseModal');
    if (!modalEl) return;

    const BsModal = (window as any).bootstrap?.Modal;
    if (!BsModal) return;

    const instance = BsModal.getInstance ? BsModal.getInstance(modalEl) ?? new BsModal(modalEl) : new BsModal(modalEl);
    instance.show();
  }

  onExpenseSaved() {
    const modalEl = document.getElementById('addExpenseModal');
    if (modalEl) {
      const BsModal = (window as any).bootstrap?.Modal;
      if (BsModal) {
        const instance = BsModal.getInstance ? BsModal.getInstance(modalEl) ?? new BsModal(modalEl) : new BsModal(modalEl);
        instance.hide();
      }
    }

    this.loadExpenses();
  }
}
