import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, tap, switchMap } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

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
  searchTerm = '';
  selectedExpense: Expense | null = null;
  selectedDeleteId: number | null = null;
  selectedDeleteDescription = '';
  showExpenseModal = false;
  showDeleteModal = false;
  exportMenuOpen = false;

  sortBy: string = 'expenseDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  private refreshSubscription?: Subscription;
  private searchSubscription?: Subscription;

  constructor(
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  this.clearBootstrapModalState();

this.searchSubscription = this.expenseService.searchTerm$.pipe(
  debounceTime(400),
  distinctUntilChanged(),
  tap(() => { this.loading = true; }),
  switchMap((term) => {
    this.searchTerm = term;
    this.currentPage = 1;
    return this.expenseService.getMyExpenses(
      this.currentPage, this.pageSize, this.sortBy, this.sortDirection, term
    ).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    );
  })
).subscribe({
  next: (response) => {
    this.expenses = response.items;
    this.totalCount = response.totalCount;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
    this.cdr.detectChanges();
  },
  error: (err) => {
    console.error(err);
    this.expenses = [];
    this.cdr.detectChanges();
  }
});

    this.loadExpenses();

    this.refreshSubscription = this.expenseService.refresh$.subscribe(() => {
      this.loadExpenses();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  private clearBootstrapModalState(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
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

  toggleExportMenu(): void {
    this.exportMenuOpen = !this.exportMenuOpen;
  }

  exportSelected(format: 'csv' | 'excel' | 'pdf'): void {
    this.exportMenuOpen = false;
    const fileName = `expenses-export-${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      this.downloadFile(this.buildCsv(), `${fileName}.csv`, 'text/csv');
      return;
    }

    if (format === 'excel') {
      this.downloadFile(this.buildExcel(), `${fileName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return;
    }

    if (format === 'pdf') {
      this.downloadFile(this.buildPdf(), `${fileName}.pdf`, 'application/pdf');
    }
  }

  private buildCsv(): Blob {
    const headers = ['Description', 'Category', 'Amount', 'Date'];
    const rows = this.expenses.map(expense => [
      this.escapeCsv(expense.description || ''),
      this.escapeCsv(expense.category || ''),
      expense.amount?.toString() ?? '0',
      expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : ''
    ]);

    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    return new Blob([content], { type: 'text/csv;charset=utf-8;' });
  }

  private buildExcel(): Blob {
    const worksheet = XLSX.utils.json_to_sheet(this.expenses.map(expense => ({
      Description: expense.description || '',
      Category: expense.category || '',
      Amount: expense.amount?.toString() ?? '0',
      Date: expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : ''
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
    const workbookBinary = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([workbookBinary], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private buildPdf(): Blob {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const rowHeight = 20;
    let y = 60;

    doc.setFontSize(16);
    doc.text('Expenses Export', margin, y);
    y += 30;

    doc.setFontSize(10);
    doc.text(`Export date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 24;

    const headers = ['Description', 'Category', 'Amount', 'Date'];
    const rows = this.expenses.map(expense => [
      expense.description || '',
      expense.category || '',
      expense.amount?.toString() ?? '0',
      expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : ''
    ]);

    const columnWidths = [200, 120, 80, 120];
    const tableStartX = margin;
    const tableStartY = y;

    // draw header row
    let x = tableStartX;
    headers.forEach((header, index) => {
      doc.text(header, x, y);
      x += columnWidths[index];
    });

    y += rowHeight;

    rows.forEach(row => {
      x = tableStartX;
      row.forEach((cell, index) => {
        const text = String(cell);
        doc.text(text, x, y, { maxWidth: columnWidths[index] - 8 });
        x += columnWidths[index];
      });
      y += rowHeight;
      if (y > 750) {
        doc.addPage();
        y = margin;
      }
    });

    const pdfOutput = doc.output('arraybuffer');
    return new Blob([pdfOutput], { type: 'application/pdf' });
  }

  private downloadFile(data: Blob, filename: string, mimeType: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: mimeType }));
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  loadExpenses(page: number = this.currentPage): void {
    this.loading = true;
    this.currentPage = page;

    this.expenseService.getMyExpenses(page, this.pageSize, this.sortBy, this.sortDirection, this.searchTerm)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.expenses = response.items;
          this.totalCount = response.totalCount;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.expenses = [];
          this.cdr.detectChanges();
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
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.selectedDeleteId === null) return;

    this.expenseService.delete(this.selectedDeleteId).subscribe({
      next: () => {
        this.loadExpenses();
        this.selectedDeleteId = null;
        this.selectedDeleteDescription = '';
        this.showDeleteModal = false;
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
    this.showExpenseModal = true;
  }

  openEditExpenseForm(exp: Expense) {
    this.selectedExpense = { ...exp };
    this.showExpenseModal = true;
  }

  closeExpenseModal() {
    this.showExpenseModal = false;
    this.clearBootstrapModalState();
  }

  onExpenseSaved() {
    this.showExpenseModal = false;
    this.clearBootstrapModalState();
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