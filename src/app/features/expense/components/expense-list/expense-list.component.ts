import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, ExpenseFormComponent],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  Math = Math;
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  totalCount = 0;
  loading = true;
  selectedExpense: Expense | null = null;
  selectedDeleteId: number | null = null;
  selectedDeleteDescription = '';

  sortBy: string = 'expenseDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  private refreshSubscription?: Subscription;

  constructor(
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
    this.refreshSubscription = this.expenseService.refresh$.subscribe(() => {
      this.loadExpenses();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  get totalExpense(): number {
    return Math.round(this.expenses.reduce((sum, item) => sum + (item.amount ?? 0), 0));
  }

  get averageExpense(): number {
    return this.expenses.length ? Math.round(this.totalExpense / this.expenses.length) : 0;
  }

  get latestExpenseDate(): string | null {
    const dates = this.expenses
      .map(expense => expense.expenseDate ? new Date(expense.expenseDate).getTime() : NaN)
      .filter(time => !Number.isNaN(time));
    return dates.length ? new Date(Math.max(...dates)).toISOString() : null;
  }

  loadExpenses(page: number = this.currentPage): void {
  this.loading = true;
  this.currentPage = page;

  this.expenseService.getMyExpenses(page, this.pageSize, this.sortBy, this.sortDirection)
    .pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();  // ← ADD this
      })
    )
    .subscribe({
      next: (response) => {
        this.expenses = response.items;
        this.totalCount = response.totalCount;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.cdr.detectChanges();  // ← ADD this
      },
      error: (err) => {
        console.error(err);
        this.expenses = [];
        this.cdr.detectChanges();  // ← ADD this
      }
    });
}

  sortByColumn(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.loadExpenses(1);
  }

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
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddExpenseForm() {
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

  previousPage(): void {
    if (this.currentPage > 1) {
      this.loadExpenses(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadExpenses(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadExpenses(page);
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  get startIndex(): number {
    return this.totalCount === 0 ? 0 : ((this.currentPage - 1) * this.pageSize) + 1;
  }
  getPageNumbers(): number[] {
  const pages: number[] = [];
  const maxVisible = 5;

  let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > this.totalPages) {
    end = this.totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}
}