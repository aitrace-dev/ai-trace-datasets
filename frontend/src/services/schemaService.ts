import { api } from './api'
import type { Schema, CreateSchemaRequest, PaginatedResponse } from '@/types'

export const schemaService = {
  async list(page = 1, pageSize = 20): Promise<PaginatedResponse<Schema>> {
    return api.get<PaginatedResponse<Schema>>('/schemas', { page, page_size: pageSize })
  },

  async get(id: string): Promise<Schema> {
    return api.get<Schema>(`/schemas/${id}`)
  },

  async create(data: CreateSchemaRequest): Promise<Schema> {
    return api.post<Schema>('/schemas', data)
  },

  async update(id: string, data: Partial<CreateSchemaRequest>): Promise<Schema> {
    return api.put<Schema>(`/schemas/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/schemas/${id}`)
  },
}
