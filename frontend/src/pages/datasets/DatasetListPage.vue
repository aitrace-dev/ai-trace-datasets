<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Datasets</h1>
        <router-link
          to="/datasets/new"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <i class="pi pi-plus mr-2"></i>
          New Dataset
        </router-link>
      </div>

      <div v-if="datasetStore.loading" class="text-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
      </div>

      <div v-else-if="datasetStore.datasets.length === 0" class="text-center py-12">
        <i class="pi pi-database text-6xl text-gray-400"></i>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No datasets</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new dataset.</p>
        <div class="mt-6">
          <router-link
            to="/datasets/new"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <i class="pi pi-plus mr-2"></i>
            New Dataset
          </router-link>
        </div>
      </div>

      <div v-else>
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-gray-200">
            <li v-for="dataset in datasetStore.datasets" :key="dataset.id">
              <router-link
                :to="`/datasets/${dataset.id}`"
                class="block hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                <div class="px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-blue-600 truncate">
                        {{ dataset.name }}
                      </p>
                      <p class="mt-1 text-sm text-gray-500">
                        {{ dataset.description || 'No description' }}
                      </p>
                    </div>
                    <div class="ml-2 flex-shrink-0 flex items-center space-x-4">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {{ dataset.rows_count }} rows
                      </span>
                      <span
                        v-if="dataset.pending_count > 0"
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800"
                      >
                        {{ dataset.pending_count }} pending
                      </span>
                    </div>
                  </div>
                </div>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md shadow">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(currentPage * pageSize, datasetStore.total) }}</span>
                of
                <span class="font-medium">{{ datasetStore.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="goToPage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  v-for="page in displayedPages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <button
                  @click="goToPage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDatasetStore } from '@/stores/datasetStore'

const datasetStore = useDatasetStore()
const currentPage = ref(1)
const pageSize = ref(20)

const totalPages = computed(() => Math.ceil(datasetStore.total / pageSize.value))

const displayedPages = computed(() => {
  const pages: number[] = []
  const maxDisplayed = 5

  if (totalPages.value <= maxDisplayed) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // Show pages around current page
    let start = Math.max(1, currentPage.value - 2)
    let end = Math.min(totalPages.value, currentPage.value + 2)

    // Adjust if near start or end
    if (currentPage.value <= 3) {
      end = maxDisplayed
    } else if (currentPage.value >= totalPages.value - 2) {
      start = totalPages.value - maxDisplayed + 1
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

async function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await datasetStore.fetchDatasets(page, pageSize.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  datasetStore.fetchDatasets(currentPage.value, pageSize.value)
})
</script>
