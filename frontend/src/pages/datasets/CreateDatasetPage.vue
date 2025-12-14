<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Create Dataset</h1>

      <div class="bg-white shadow sm:rounded-lg">
        <form @submit.prevent="handleSubmit" class="space-y-6 p-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <div>
            <label for="schema" class="block text-sm font-medium text-gray-700">Schema</label>
            <div v-if="!schemaStore.loading && schemaStore.schemas.length === 0" class="mt-1">
              <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p class="text-sm text-blue-700 mb-3">No schemas available yet. Create one to continue.</p>
                <button
                  type="button"
                  @click="handleCreateSchema"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create New Schema
                </button>
              </div>
            </div>
            <select
              v-else
              id="schema"
              v-model="form.schema_id"
              required
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a schema</option>
              <option v-for="schema in schemaStore.schemas" :key="schema.id" :value="schema.id">
                {{ schema.name }}
              </option>
            </select>
            <div v-if="schemaStore.schemas.length > 0" class="mt-2">
              <button
                type="button"
                @click="handleCreateSchema"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                + Create new schema
              </button>
            </div>
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end space-x-3">
            <router-link
              to="/datasets"
              class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </router-link>
            <button
              type="submit"
              :disabled="datasetStore.loading || schemaStore.schemas.length === 0"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ datasetStore.loading ? 'Creating...' : 'Create Dataset' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDatasetStore } from '@/stores/datasetStore'
import { useSchemaStore } from '@/stores/schemaStore'

const router = useRouter()
const route = useRoute()
const datasetStore = useDatasetStore()
const schemaStore = useSchemaStore()

// Restore form data from sessionStorage if returning from schema creation
const savedForm = sessionStorage.getItem('pendingDataset')
const initialForm = savedForm ? JSON.parse(savedForm) : { name: '', description: '', schema_id: '' }

const form = ref(initialForm)
const error = ref<string | null>(null)

onMounted(async () => {
  await schemaStore.fetchSchemas()

  // If returning from schema creation, pre-select the new schema
  if (route.query.schema_id && schemaStore.schemas.length > 0) {
    form.value.schema_id = route.query.schema_id as string
    // Clear the saved form data
    sessionStorage.removeItem('pendingDataset')
  }
})

function handleCreateSchema() {
  // Save current form data to sessionStorage
  sessionStorage.setItem('pendingDataset', JSON.stringify({
    name: form.value.name,
    description: form.value.description,
  }))

  // Navigate to schema creation with return path
  router.push('/schemas/new?returnTo=dataset')
}

async function handleSubmit() {
  error.value = null

  try {
    await datasetStore.createDataset(form.value)
    // Clear saved form data
    sessionStorage.removeItem('pendingDataset')
    router.push('/datasets')
  } catch (err) {
    error.value = 'Failed to create dataset'
  }
}
</script>
