<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-500">Loading schema...</p>
      </div>

      <!-- Schema loaded -->
      <div v-else-if="schema" class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <router-link
              to="/schemas"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <h1 class="text-2xl font-bold text-gray-900">{{ schema.name }}</h1>
          </div>
          <div class="flex space-x-3">
            <button
              v-if="!editMode"
              @click="editMode = true"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit Schema
            </button>
            <button
              @click="confirmDelete"
              class="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- View Mode -->
        <div v-if="!editMode" class="space-y-6">
          <!-- Basic Info -->
          <div class="bg-white shadow sm:rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Schema Name</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ schema.name }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Total Fields</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ schema.fields?.length || 0 }}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-sm font-medium text-gray-500">Description</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ schema.description || 'No description' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Created</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDate(schema.created_at) }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDate(schema.updated_at) }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- System Fields -->
          <div class="bg-white shadow sm:rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">System Fields (Read-Only)</h3>
              <div class="space-y-3">
                <div v-for="sysField in systemFields" :key="sysField.name" class="flex items-center justify-between py-2 border-b border-gray-200">
                  <div class="flex items-center space-x-3">
                    <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{{ sysField.name }}</span>
                    <span class="text-sm text-gray-600">{{ sysField.type }}</span>
                  </div>
                  <span class="text-xs text-gray-500">{{ sysField.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom Fields -->
          <div class="bg-white shadow sm:rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Custom Fields</h3>
              <div v-if="schema.fields && schema.fields.length > 0" class="space-y-4">
                <div
                  v-for="field in schema.fields"
                  :key="field.id"
                  class="border border-gray-300 rounded-lg p-4 bg-gray-50"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3">
                        <h4 class="text-base font-medium text-gray-900">{{ field.name }}</h4>
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="{
                            'bg-blue-100 text-blue-800': field.type === 'boolean',
                            'bg-green-100 text-green-800': field.type === 'text',
                            'bg-purple-100 text-purple-800': field.type === 'numeric',
                            'bg-yellow-100 text-yellow-800': field.type === 'enum',
                          }"
                        >
                          {{ field.type }}
                        </span>
                        <span v-if="field.required" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      </div>

                      <!-- Field Configuration -->
                      <div v-if="field.config && Object.keys(field.config).length > 0" class="mt-3 text-sm text-gray-600">
                        <div v-if="field.type === 'enum' && field.config.options">
                          <span class="font-medium">Options:</span>
                          <span class="ml-2">{{ field.config.options.join(', ') }}</span>
                        </div>
                        <div v-if="field.type === 'text'">
                          <span v-if="field.config.multiline" class="mr-3">Multiline</span>
                          <span v-if="field.config.max_length">Max Length: {{ field.config.max_length }}</span>
                        </div>
                        <div v-if="field.type === 'numeric'">
                          <span v-if="field.config.decimal" class="mr-3">Decimal</span>
                          <span v-if="field.config.min !== undefined" class="mr-3">Min: {{ field.config.min }}</span>
                          <span v-if="field.config.max !== undefined">Max: {{ field.config.max }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="text-sm text-gray-500">
                      Position: {{ field.position }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-6 text-gray-500">
                No custom fields defined
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Mode -->
        <div v-else class="bg-white shadow sm:rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <p class="text-gray-600 mb-4">
              <strong>Note:</strong> Editing schemas is currently view-only. To modify a schema, create a new one.
            </p>
            <button
              @click="editMode = false"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to View
            </button>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else class="bg-red-50 border-l-4 border-red-400 p-4">
        <p class="text-sm text-red-700">Failed to load schema</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useSchemaStore } from '@/stores/schemaStore'
import type { SchemaResponse } from '@/types'

const router = useRouter()
const route = useRoute()
const schemaStore = useSchemaStore()

const schema = ref<SchemaResponse | null>(null)
const loading = ref(true)
const editMode = ref(false)

const systemFields = [
  { name: 'image_url', type: 'String', description: 'URL of the image (required)' },
  { name: 'created_at', type: 'Datetime', description: 'When the row was created' },
  { name: 'created_by', type: 'User', description: 'Who created the row' },
  { name: 'updated_at', type: 'Datetime', description: 'Last update timestamp' },
  { name: 'updated_by', type: 'User', description: 'Who last updated the row' },
]

onMounted(async () => {
  const schemaId = route.params.id as string
  try {
    schema.value = await schemaStore.fetchSchema(schemaId)
  } catch (error) {
    console.error('Failed to load schema:', error)
  } finally {
    loading.value = false
  }
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function confirmDelete() {
  if (confirm(`Are you sure you want to delete the schema "${schema.value?.name}"? This action cannot be undone.`)) {
    deleteSchema()
  }
}

async function deleteSchema() {
  if (!schema.value) return

  try {
    await schemaStore.deleteSchema(schema.value.id)
    router.push('/schemas')
  } catch (error) {
    alert('Failed to delete schema')
  }
}
</script>
