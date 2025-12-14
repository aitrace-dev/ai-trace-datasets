import { api } from './api'
import type { User, LoginRequest, LoginResponse } from '@/types'

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', data)
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me')
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  },

  async resetPassword(newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', {
      new_password: newPassword,
    })
  },
}
