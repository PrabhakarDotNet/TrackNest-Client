import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit {

  expenses: Expense[] = [];

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses() {
  this.expenseService.getAll().subscribe({
    next: (data) => {
      console.log('API DATA:', data); 

      this.expenses = data.map((x: any) => ({
        id: x.id,
        amount: x.amount ?? x.Amount,
        category: x.category ?? x.Category,
        description: x.description ?? x.Description,
        expenseDate: x.expenseDate ?? x.Date
      }));

    },
    error: (err) => console.log(err)
  });
}

  deleteExpense(id: number) {
    this.expenseService.delete(id).subscribe({
      next: () => this.loadExpenses(),
      error: (err) => console.log(err)
    });
  }
}