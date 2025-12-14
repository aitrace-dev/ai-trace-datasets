import { defineStore } from 'pinia'
import { ref } from 'vue'
import { datasetService } from '@/services/datasetService'
import type { Dataset, CreateDatasetRequest, CreateRowRequest, DatasetRow } from '@/types'

export const useDatasetStore = defineStore('dataset', () => {
  const datasets = ref<Dataset[]>([])
  const currentDataset = ref<Dataset | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  async function fetchDatasets(page = 1, pageSize = 20) {
    loading.value = true
    error.value = null
    try {
      const response = await datasetService.list(page, pageSize)
      datasets.value = response.items
      total.value = response.total
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch datasets'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDataset(id: string) {
    loading.value = true
    error.value = null
    try {
      currentDataset.value = await datasetService.get(id)
      return currentDataset.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch dataset'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createDataset(data: CreateDatasetRequest) {
    loading.value = true
    error.value = null
    try {
      const dataset = await datasetService.create(data)
      datasets.value.unshift(dataset)
      return dataset
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create dataset'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateDataset(id: string, data: Partial<CreateDatasetRequest>) {
    loading.value = true
    error.value = null
    try {
      const dataset = await datasetService.update(id, data)
      const index = datasets.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        datasets.value[index] = dataset
      }
      if (currentDataset.value?.id === id) {
        currentDataset.value = dataset
      }
      return dataset
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update dataset'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteDataset(id: string) {
    loading.value = true
    error.value = null
    try {
      await datasetService.delete(id)
      datasets.value = datasets.value.filter((d) => d.id !== id)
      if (currentDataset.value?.id === id) {
        currentDataset.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete dataset'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createRow(datasetId: string, data: CreateRowRequest): Promise<DatasetRow> {
    loading.value = true
    error.value = null
    try {
      const row = await datasetService.createRow(datasetId, data)
      // Refresh the current dataset to update counts
      if (currentDataset.value?.id === datasetId) {
        await fetchDataset(datasetId)
      }
      return row
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create row'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    datasets,
    currentDataset,
    loading,
    error,
    total,
    fetchDatasets,
    fetchDataset,
    createDataset,
    updateDataset,
    deleteDataset,
    createRow,
  }
})
