import { api } from './api'
import type { DatasetRow, CreateRowRequest, CSVImportRequest, CSVImportResponse, PaginatedResponse } from '@/types'

export const rowService = {
  async list(datasetId: string, page = 1, pageSize = 20, status?: string): Promise<PaginatedResponse<DatasetRow>> {
    const params: any = { page, page_size: pageSize }
    if (status) params.status = status
    return api.get<PaginatedResponse<DatasetRow>>(`/datasets/${datasetId}/rows`, params)
  },

  async getQueue(datasetId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<DatasetRow>> {
    return api.get<PaginatedResponse<DatasetRow>>(`/datasets/${datasetId}/rows/queue`, { page, page_size: pageSize })
  },

  async get(datasetId: string, rowId: string): Promise<DatasetRow> {
    return api.get<DatasetRow>(`/datasets/${datasetId}/rows/${rowId}`)
  },

  async create(datasetId: string, data: CreateRowRequest): Promise<DatasetRow> {
    return api.post<DatasetRow>(`/datasets/${datasetId}/rows`, data)
  },

  async update(datasetId: string, rowId: string, data: Partial<CreateRowRequest>): Promise<DatasetRow> {
    return api.put<DatasetRow>(`/datasets/${datasetId}/rows/${rowId}`, data)
  },

  async delete(datasetId: string, rowId: string): Promise<void> {
    await api.delete(`/datasets/${datasetId}/rows/${rowId}`)
  },

  async bulkUpdateStatus(datasetId: string, rowIds: string[], status: string): Promise<void> {
    await api.post(`/datasets/${datasetId}/rows/bulk/update-status`, { row_ids: rowIds, status })
  },

  async bulkDelete(datasetId: string, rowIds: string[]): Promise<void> {
    await api.post(`/datasets/${datasetId}/rows/bulk/delete`, rowIds)
  },

  async importCSV(datasetId: string, data: CSVImportRequest): Promise<CSVImportResponse> {
    return api.post<CSVImportResponse>(`/datasets/${datasetId}/rows/import`, data)
  },

  async exportCSV(datasetId: string, onlyReviewed: boolean = true): Promise<Blob> {
    const params = new URLSearchParams({ only_reviewed: String(onlyReviewed) })
    const response = await fetch(`/api/v1/datasets/${datasetId}/rows/export?${params}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to export CSV')
    }

    return response.blob()
  },
}
