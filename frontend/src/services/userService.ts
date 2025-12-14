import { api } from './api'
import type { User, PaginatedResponse } from '@/types'

export interface CreateUserRequest {
  email: string
  password: string
  role: 'admin' | 'user'
}

export interface CreateUserResponse {
  user: User
  temp_password: string
}

export interface UpdateUserRequest {
  role?: 'admin' | 'user'
}

export interface ResetPasswordResponse {
  temp_password: string
}

export const userService = {
  async list(page = 1, pageSize = 20): Promise<PaginatedResponse<User>> {
    return api.get<PaginatedResponse<User>>('/users', { page, page_size: pageSize })
  },

  async get(userId: string): Promise<User> {
    return api.get<User>(`/users/${userId}`)
  },

  async create(data: CreateUserRequest): Promise<CreateUserResponse> {
    return api.post<CreateUserResponse>('/users', data)
  },

  async update(userId: string, data: UpdateUserRequest): Promise<User> {
    return api.put<User>(`/users/${userId}`, data)
  },

  async delete(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`)
  },

  async resetPassword(userId: string): Promise<ResetPasswordResponse> {
    return api.post<ResetPasswordResponse>(`/users/${userId}/reset-password`, {})
  },
}
