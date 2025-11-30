export enum UserRole {
  User = 'User',
  Admin = 'Admin'
}

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface Vacation {
  vacationId: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  imageFileName: string | null;
  followersCount?: number;
  isFollowing?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VacationsResponse {
  vacations: Vacation[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ReportData {
  destination: string;
  followersCount: number;
}
