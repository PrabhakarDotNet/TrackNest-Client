import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../expense/services/expense.service';
import { Expense } from '../expense/models/expense.model';
import { Router } from '@angular/router';

interface ChartPoint {
  month: string;
  amount: number;
  height: number;
}

interface CategorySummaryItem {
  category: string;
  total: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-expense-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-dashboard.component.html',
  styleUrls: ['./expense-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseDashboardComponent implements OnInit {
  expenses: Expense[] = [];
  chartData: ChartPoint[] = [];
  totalExpense = 0;
  averageExpense = 0;
  expenseCount = 0;
  loading = true;

  private _categorySummary: CategorySummaryItem[] = [];

  private readonly colorPalette = [
    '#6366f1',
    '#06b6d4',
    '#10b981',
    '#f97316',
    '#ef4444',
    '#8b5cf6',
    '#f59e0b'
  ];

  constructor(
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  get categorySummary(): CategorySummaryItem[] {
    return this._categorySummary;
  }

  ngOnInit(): void {
    this.loadDashboardData();

    this.expenseService.refresh$.subscribe(() => {
      this.loadDashboardData();
    });
  }
goToExpenses(): void {
  this.router.navigate(['/expenses']);
}

  loadDashboardData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.expenseService.getMyExpenses().subscribe({
  next: (response) => {
       this.expenses = response.items;
        this.expenseCount = this.expenses.length;
        this.totalExpense = Math.round(
          this.expenses.reduce((sum, item) => sum + (item.amount ?? 0), 0)
        );
        this.averageExpense =
          this.expenseCount > 0 ? Math.round(this.totalExpense / this.expenseCount) : 0;
        this.chartData = this.buildChart(this.expenses);
        this._categorySummary = this.buildCategorySummary(this.expenses);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error(err);
        this.expenses = [];
        this.chartData = [];
        this.totalExpense = 0;
        this.averageExpense = 0;
        this.expenseCount = 0;
        this._categorySummary = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  buildChart(expenses: Expense[]): ChartPoint[] {
    const now = new Date();
    const months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      months.push({
        key,
        label: date.toLocaleString('default', { month: 'short' })
      });
    }

    const monthTotals = new Map<string, number>();
    months.forEach(month => monthTotals.set(month.key, 0));

    for (const expense of expenses) {
      if (!expense?.expenseDate) continue;

      const date = new Date(expense.expenseDate);
      if (isNaN(date.getTime())) continue;

      const key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      if (!monthTotals.has(key)) continue;

      monthTotals.set(key, (monthTotals.get(key) ?? 0) + (expense.amount ?? 0));
    }

    const maxAmount = Math.max(...Array.from(monthTotals.values()), 1);

    return months.map(month => {
      const amount = Math.round(monthTotals.get(month.key) ?? 0);
      return {
        month: month.label,
        amount,
        height: Math.round((amount / maxAmount) * 100)
      };
    });
  }

  private buildCategorySummary(expenses: Expense[]): CategorySummaryItem[] {
    const totals = new Map<string, number>();

    for (const expense of expenses) {
      const category = expense.category || 'Uncategorized';
      totals.set(category, (totals.get(category) ?? 0) + (expense.amount ?? 0));
    }

    const entries = Array.from(totals.entries())
      .map(([category, total]) => ({ category, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total);

    if (!entries.length) return [];

    const max = Math.max(...entries.map(x => x.total), 1);

    return entries.map((entry, index) => ({
      category: entry.category,
      total: entry.total,
      percent: Math.round((entry.total / max) * 100),
      color: this.colorPalette[index % this.colorPalette.length]
    }));
  }
}