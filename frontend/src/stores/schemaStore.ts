import { defineStore } from 'pinia'
import { ref } from 'vue'
import { schemaService } from '@/services/schemaService'
import type { Schema, CreateSchemaRequest } from '@/types'

export const useSchemaStore = defineStore('schema', () => {
  const schemas = ref<Schema[]>([])
  const currentSchema = ref<Schema | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  async function fetchSchemas(page = 1, pageSize = 20) {
    loading.value = true
    error.value = null
    try {
      const response = await schemaService.list(page, pageSize)
      schemas.value = response.items
      total.value = response.total
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch schemas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSchema(id: string) {
    loading.value = true
    error.value = null
    try {
      currentSchema.value = await schemaService.get(id)
      return currentSchema.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch schema'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSchema(data: CreateSchemaRequest) {
    loading.value = true
    error.value = null
    try {
      const schema = await schemaService.create(data)
      schemas.value.unshift(schema)
      return schema
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create schema'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSchema(id: string, data: Partial<CreateSchemaRequest>) {
    loading.value = true
    error.value = null
    try {
      const schema = await schemaService.update(id, data)
      const index = schemas.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        schemas.value[index] = schema
      }
      if (currentSchema.value?.id === id) {
        currentSchema.value = schema
      }
      return schema
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update schema'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSchema(id: string) {
    loading.value = true
    error.value = null
    try {
      await schemaService.delete(id)
      schemas.value = schemas.value.filter((s) => s.id !== id)
      if (currentSchema.value?.id === id) {
        currentSchema.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete schema'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    schemas,
    currentSchema,
    loading,
    error,
    total,
    fetchSchemas,
    fetchSchema,
    createSchema,
    updateSchema,
    deleteSchema,
  }
})
