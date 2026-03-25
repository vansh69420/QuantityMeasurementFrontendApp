import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminUser, AdminUserDetail } from './admin.models';
import { HistoryEntity } from '../quantity/quantity.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getUsers(): Promise<AdminUser[]> {
    return firstValueFrom(this.http.get<AdminUser[]>('/api/admin/users'));
  }

  getUserById(userId: string): Promise<AdminUserDetail> {
    return firstValueFrom(this.http.get<AdminUserDetail>(`/api/admin/users/${userId}`));
  }

  getHistoryForUser(userId: string): Promise<HistoryEntity[]> {
    return firstValueFrom(this.http.get<HistoryEntity[]>(`/api/admin/users/${userId}/history`));
  }
}
