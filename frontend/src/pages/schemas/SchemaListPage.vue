<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Schemas</h1>
        <router-link
          to="/schemas/new"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          + New Schema
        </router-link>
      </div>

      <!-- Loading state -->
      <div v-if="schemaStore.loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-500">Loading schemas...</p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!schemaStore.loading && schemaStore.schemas.length === 0"
        class="bg-white shadow sm:rounded-lg"
      >
        <div class="px-4 py-12 text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No schemas</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating a new schema.</p>
          <div class="mt-6">
            <router-link
              to="/schemas/new"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + New Schema
            </router-link>
          </div>
        </div>
      </div>

      <!-- Schema list -->
      <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" class="divide-y divide-gray-200">
          <li v-for="schema in schemaStore.schemas" :key="schema.id">
            <router-link
              :to="`/schemas/${schema.id}`"
              class="block hover:bg-gray-50 transition duration-150"
            >
              <div class="px-4 py-4 sm:px-6">
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-medium text-gray-900 truncate">
                      {{ schema.name }}
                    </h3>
                    <p v-if="schema.description" class="mt-1 text-sm text-gray-500">
                      {{ schema.description }}
                    </p>
                  </div>
                  <div class="ml-4 flex-shrink-0 flex items-center space-x-4">
                    <div class="text-right">
                      <div class="text-sm text-gray-900">
                        {{ schema.fields?.length || 0 }} fields
                      </div>
                      <div class="text-xs text-gray-500">
                        Created {{ formatDate(schema.created_at) }}
                      </div>
                    </div>
                    <svg
                      class="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Pagination -->
      <div
        v-if="schemaStore.schemas.length > 0 && schemaStore.total > schemaStore.schemas.length"
        class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg"
      >
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="previousPage"
            :disabled="page === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            @click="nextPage"
            :disabled="page * pageSize >= schemaStore.total"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ (page - 1) * pageSize + 1 }}</span>
              to
              <span class="font-medium">{{ Math.min(page * pageSize, schemaStore.total) }}</span>
              of
              <span class="font-medium">{{ schemaStore.total }}</span>
              schemas
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="previousPage"
                :disabled="page === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                @click="nextPage"
                :disabled="page * pageSize >= schemaStore.total"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useSchemaStore } from '@/stores/schemaStore'

const schemaStore = useSchemaStore()
const page = ref(1)
const pageSize = ref(20)

onMounted(async () => {
  await schemaStore.fetchSchemas(page.value, pageSize.value)
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function previousPage() {
  if (page.value > 1) {
    page.value--
    await schemaStore.fetchSchemas(page.value, pageSize.value)
  }
}

async function nextPage() {
  if (page.value * pageSize.value < schemaStore.total) {
    page.value++
    await schemaStore.fetchSchemas(page.value, pageSize.value)
  }
}
</script>
