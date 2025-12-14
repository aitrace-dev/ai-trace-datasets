import { api } from './api'
import type { Dataset, CreateDatasetRequest, PaginatedResponse, CreateRowRequest, DatasetRow } from '@/types'

export const datasetService = {
  async list(page = 1, pageSize = 20): Promise<PaginatedResponse<Dataset>> {
    return api.get<PaginatedResponse<Dataset>>('/datasets', { page, page_size: pageSize })
  },

  async get(id: string): Promise<Dataset> {
    return api.get<Dataset>(`/datasets/${id}`)
  },

  async create(data: CreateDatasetRequest): Promise<Dataset> {
    return api.post<Dataset>('/datasets', data)
  },

  async update(id: string, data: Partial<CreateDatasetRequest>): Promise<Dataset> {
    return api.put<Dataset>(`/datasets/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/datasets/${id}`)
  },

  async createRow(datasetId: string, data: CreateRowRequest): Promise<DatasetRow> {
    return api.post<DatasetRow>(`/datasets/${datasetId}/rows`, data)
  },
}
