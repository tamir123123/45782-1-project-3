import axios from 'axios';
import { AuthResponse, VacationsResponse, Vacation, ReportData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Vacations API
export const vacationsApi = {
  getAll: async (params?: {
    page?: number;
    following?: boolean;
    notStarted?: boolean;
    active?: boolean;
  }): Promise<VacationsResponse> => {
    const response = await api.get('/vacations', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Vacation> => {
    const response = await api.get(`/vacations/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<Vacation> => {
    const response = await api.post('/vacations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, formData: FormData): Promise<Vacation> => {
    const response = await api.put(`/vacations/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vacations/${id}`);
  },

  follow: async (id: string): Promise<void> => {
    await api.post(`/vacations/${id}/follow`);
  },

  unfollow: async (id: string): Promise<void> => {
    await api.delete(`/vacations/${id}/follow`);
  },

  getReport: async (): Promise<ReportData[]> => {
    const response = await api.get('/vacations/report');
    return response.data;
  },

  downloadCSV: async (): Promise<void> => {
    const response = await api.get('/vacations/csv', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vacation-followers.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const getImageUrl = (fileName: string | null): string => {
  // When running in Docker, API_URL is '/api', so we need to handle that
  // When running locally, API_URL is 'http://localhost:3000/api'
  const baseUrl = API_URL.startsWith('http') ? API_URL.replace('/api', '') : '';

  // Use default.jpg from uploads folder if no fileName provided
  if (!fileName) {
    return `${baseUrl}/uploads/default.jpg`;
  }

  return `${baseUrl}/uploads/${fileName}`;
};
