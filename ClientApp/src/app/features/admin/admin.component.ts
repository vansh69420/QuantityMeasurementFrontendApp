import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../core/auth.service';
import { AdminService } from './admin.service';
import { AdminUser, AdminUserDetail } from './admin.models';
import { HistoryEntity } from '../quantity/quantity.models';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  selectedUser: AdminUserDetail | null = null;
  selectedHistory: HistoryEntity[] = [];

  searchText = '';

  usersBusy = false;
  detailsBusy = false;
  historyBusy = false;

  usersError: string | null = null;
  detailsError: string | null = null;
  historyError: string | null = null;

  constructor(
    private auth: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.usersBusy = true;
    this.usersError = null;

    try {
      const users = await this.adminService.getUsers();
      this.users = users ?? [];
      this.applyFilter();

      if (!this.selectedUser && this.filteredUsers.length > 0) {
        await this.selectUser(this.filteredUsers[0]);
      }
    } catch (e: any) {
      this.users = [];
      this.filteredUsers = [];
      this.usersError = this.extractErrorMessage(e, 'Failed to load users.');
    } finally {
      this.usersBusy = false;
    }
  }

  async selectUser(user: AdminUser): Promise<void> {
    if (!user?.userId) {
      return;
    }

    this.detailsBusy = true;
    this.historyBusy = true;
    this.detailsError = null;
    this.historyError = null;

    try {
      const [details, history] = await Promise.all([
        this.adminService.getUserById(user.userId),
        this.adminService.getHistoryForUser(user.userId)
      ]);

      this.selectedUser = details;
      this.selectedHistory = history ?? [];
    } catch (e: any) {
      this.selectedUser = null;
      this.selectedHistory = [];
      const message = this.extractErrorMessage(e, 'Failed to load selected user.');
      this.detailsError = message;
      this.historyError = message;
    } finally {
      this.detailsBusy = false;
      this.historyBusy = false;
    }
  }

  async reloadSelectedUser(): Promise<void> {
    if (!this.selectedUser?.userId) {
      return;
    }

    this.historyBusy = true;
    this.historyError = null;

    try {
      this.selectedHistory = await this.adminService.getHistoryForUser(this.selectedUser.userId);
    } catch (e: any) {
      this.selectedHistory = [];
      this.historyError = this.extractErrorMessage(e, 'Failed to load user history.');
    } finally {
      this.historyBusy = false;
    }
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchText = input?.value ?? '';
    this.applyFilter();
  }

  goToApp(): void {
    this.router.navigateByUrl('/app');
  }

  logout(): void {
    this.auth.logoutClientOnly();
    this.router.navigateByUrl('/login');
  }

  trackByUserId(_: number, user: AdminUser): string {
    return user.userId;
  }

  trackByHistoryOpId(index: number, item: HistoryEntity): string {
    return item.operationId ?? String(index);
  }

  formatHistoryTitle(item: HistoryEntity): string {
    if (item.equalityResult !== undefined && item.equalityResult !== null) {
      return `Compare → ${item.equalityResult ? 'TRUE' : 'FALSE'}`;
    }

    if (item.scalarResult !== undefined && item.scalarResult !== null) {
      return `Divide → ${item.scalarResult}`;
    }

    if (item.resultValue !== undefined && item.resultValue !== null) {
      const unit = item.resultUnitText ? ` ${item.resultUnitText}` : '';
      return `Result → ${item.resultValue}${unit}`;
    }

    return `Operation ${item.operationType ?? ''}`;
  }

  private applyFilter(): void {
    const normalizedSearch = this.searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.role.toLowerCase().includes(normalizedSearch)
    );
  }

  private extractErrorMessage(error: any, fallbackMessage: string): string {
    if (!error) {
      return fallbackMessage;
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (typeof error.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message;
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }
}
