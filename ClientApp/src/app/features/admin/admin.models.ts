import { HistoryEntity } from '../quantity/quantity.models';

export interface AdminUser {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface AdminUserDetail extends AdminUser {}

export interface AdminViewState {
  users: AdminUser[];
  selectedUser: AdminUserDetail | null;
  selectedHistory: HistoryEntity[];
}

export type { HistoryEntity };
