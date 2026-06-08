import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseListComponent } from '../../features/expense/components/expense-list/expense-list.component';
import { ExpenseService } from '../../features/expense/services/expense.service';
import { Expense } from '../../features/expense/models/expense.model';

interface ChartPoint {
  month: string;
  amount: number;
  height: number;
}

@Component({
  selector: 'app-expense-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ExpenseListComponent],
  templateUrl: './expense-dashboard.component.html',
  styleUrls: ['./expense-dashboard.component.scss']
})
export class ExpenseDashboardComponent implements OnInit {
  expenses: Expense[] = [];
  chartData: ChartPoint[] = [];
  totalExpense = 0;
  averageExpense = 0;
  expenseCount = 0;
  loading = true;

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.expenseService.getAll().subscribe({
      next: (data: Expense[]) => {
        this.expenses = data;
        this.expenseCount = data.length;
        this.totalExpense = data.reduce((sum, item) => sum + (item.amount ?? 0), 0);
        this.averageExpense = this.expenseCount ? this.totalExpense / this.expenseCount : 0;
        this.chartData = this.buildChart(data);
        this.loading = false;
      },
      error: () => {
        this.expenses = [];
        this.chartData = this.buildChart([]);
        this.loading = false;
      }
    });
  }

  buildChart(expenses: Expense[]): ChartPoint[] {
    const now = new Date();
    const months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: date.toLocaleString('default', { month: 'short' })
      });
    }

    const monthTotals = new Map<string, number>();
    months.forEach((month) => monthTotals.set(month.key, 0));

    for (const expense of expenses) {
      const date = expense.expenseDate ? new Date(expense.expenseDate) : null;
      if (!date || Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthTotals.has(key)) continue;
      monthTotals.set(key, (monthTotals.get(key) ?? 0) + expense.amount);
    }

    const maxAmount = Math.max(...Array.from(monthTotals.values()), 1);
    return months.map((month) => ({
      month: month.label,
      amount: monthTotals.get(month.key) ?? 0,
      height: Math.round(((monthTotals.get(month.key) ?? 0) / maxAmount) * 100)
    }));
  }
}
