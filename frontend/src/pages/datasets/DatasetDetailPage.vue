<template>
  <AppLayout>
    <div v-if="datasetStore.loading" class="text-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
    </div>

    <div v-else-if="datasetStore.currentDataset" class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ datasetStore.currentDataset.name }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ datasetStore.currentDataset.description }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="relative">
            <button
              @click="showExportDropdown = !showExportDropdown"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <i class="pi pi-download mr-2"></i>
              Download CSV
              <i class="pi pi-chevron-down ml-2 text-xs"></i>
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="showExportDropdown"
              class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
            >
              <div class="py-1">
                <button
                  @click="handleDownloadCSV(true)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Only Reviewed Rows</span>
                  <i v-if="exportOnlyReviewed" class="pi pi-check text-blue-600"></i>
                </button>
                <button
                  @click="handleDownloadCSV(false)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>All Rows</span>
                  <i v-if="!exportOnlyReviewed" class="pi pi-check text-blue-600"></i>
                </button>
              </div>
            </div>
          </div>
          <router-link
            :to="`/datasets/${datasetStore.currentDataset.id}/rows/new`"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <i class="pi pi-plus mr-2"></i>
            Add Row
          </router-link>
        </div>
      </div>

      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'rows'"
            :class="[
              activeTab === 'rows'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Rows ({{ reviewedCount }})
          </button>
          <button
            @click="activeTab = 'queue'"
            :class="[
              activeTab === 'queue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Queue ({{ datasetStore.currentDataset.pending_count }})
          </button>
          <button
            @click="activeTab = 'settings'"
            :class="[
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Settings
          </button>
        </nav>
      </div>

      <div v-if="activeTab === 'rows'">
        <!-- Loading state -->
        <div v-if="rowsLoading" class="text-center py-12 bg-white shadow sm:rounded-md">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-500">Loading rows...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="rows.length === 0" class="text-center py-12 bg-white shadow sm:rounded-md">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No rows</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by adding your first row.</p>
          <div class="mt-6">
            <router-link
              :to="`/datasets/${datasetStore.currentDataset.id}/rows/new`"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Row
            </router-link>
          </div>
        </div>

        <!-- Rows table -->
        <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th v-for="field in schemaFields" :key="field.id" scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ field.name }}
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated By
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated At
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <img
                      :src="row.image_url"
                      :alt="row.id"
                      class="h-24 w-24 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                      @click="openImageModal(row.image_url)"
                      @error="handleImageError"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                        row.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      ]"
                    >
                      {{ row.status }}
                    </span>
                  </td>
                  <td v-for="field in schemaFields" :key="field.id" class="px-6 py-4 text-sm text-gray-900">
                    <span v-if="field.type === 'boolean'">
                      {{ row.data[field.id] ? 'Yes' : 'No' }}
                    </span>
                    <span v-else class="block max-w-xs truncate" :title="row.data[field.id]">
                      {{ row.data[field.id] || '-' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(row.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="max-w-xs truncate" :title="row.updated_by_email || '-'">
                      {{ row.updated_by_email || '-' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(row.updated_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="openEditModal(row)"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteRow(row.id)"
                      class="text-red-600 hover:text-red-900 ml-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                  <span class="font-medium">{{ Math.min(currentPage * pageSize, totalRows) }}</span>
                  of
                  <span class="font-medium">{{ totalRows }}</span>
                  results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span class="sr-only">Previous</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {{ currentPage }} of {{ totalPages }}
                  </span>
                  <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span class="sr-only">Next</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'queue'">
        <!-- Loading state -->
        <div v-if="queueLoading" class="text-center py-12 bg-white shadow sm:rounded-md">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-500">Loading queue...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="queueRows.length === 0" class="text-center py-12 bg-white shadow sm:rounded-md">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No pending rows</h3>
          <p class="mt-1 text-sm text-gray-500">All rows have been reviewed!</p>
        </div>

        <!-- Queue review interface -->
        <div v-else class="bg-white shadow sm:rounded-md">
          <!-- Current row display -->
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm text-gray-500">
                Row {{ queueCurrentIndex + 1 }} of {{ queueTotal }}
              </div>
              <div class="flex space-x-2">
                <button
                  @click="prevQueueRow"
                  :disabled="queueCurrentIndex === 0"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  @click="nextQueueRow"
                  :disabled="queueCurrentIndex >= queueTotal - 1"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: ((queueCurrentIndex + 1) / queueTotal * 100) + '%' }"
              ></div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <!-- Image -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">Image</h3>
                <div class="border rounded-lg overflow-hidden bg-gray-50">
                  <img
                    v-if="currentQueueRow"
                    :src="currentQueueRow.image_url"
                    :alt="currentQueueRow.id"
                    class="w-full h-auto object-contain max-h-96 cursor-pointer hover:opacity-75 transition-opacity"
                    @click="openImageModal(currentQueueRow.image_url)"
                    @error="handleImageError"
                  />
                </div>
              </div>

              <!-- Row data (Editable) -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">Row Data (Editable)</h3>
                <div v-if="currentQueueRow" class="space-y-4">
                  <div v-for="field in schemaFields" :key="field.id">
                    <!-- Boolean Field -->
                    <div v-if="field.type === 'boolean'">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <div class="flex items-center space-x-4">
                        <label class="flex items-center">
                          <input
                            v-model="editableData[field.id]"
                            type="radio"
                            :value="true"
                            :name="`queue-field-${field.id}`"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span class="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label class="flex items-center">
                          <input
                            v-model="editableData[field.id]"
                            type="radio"
                            :value="false"
                            :name="`queue-field-${field.id}`"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span class="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <!-- Text Field -->
                    <div v-else-if="field.type === 'text'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <textarea
                        v-if="field.config?.multiline"
                        v-model="editableData[field.id]"
                        :required="field.required"
                        :maxlength="field.config?.max_length || 5000"
                        rows="3"
                        class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      ></textarea>
                      <input
                        v-else
                        v-model="editableData[field.id]"
                        type="text"
                        :required="field.required"
                        :maxlength="field.config?.max_length || 5000"
                        class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <!-- Numeric Field -->
                    <div v-else-if="field.type === 'numeric'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <input
                        v-model.number="editableData[field.id]"
                        :type="field.config?.decimal ? 'number' : 'number'"
                        :step="field.config?.decimal ? '0.01' : '1'"
                        :min="field.config?.min"
                        :max="field.config?.max"
                        :required="field.required"
                        class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <!-- Enum Field -->
                    <div v-else-if="field.type === 'enum'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="editableData[field.id]"
                        :required="field.required"
                        class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select an option</option>
                        <option v-for="option in field.config?.options" :key="option" :value="option">
                          {{ option }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Metadata -->
                  <div class="mt-6 pt-4 border-t border-gray-300">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Metadata</h4>
                    <div class="space-y-2 text-sm text-gray-600">
                      <div>
                        <span class="font-medium">Created:</span> {{ formatDate(currentQueueRow?.created_at || '') }}
                      </div>
                      <div>
                        <span class="font-medium">Created By:</span> {{ currentQueueRow?.created_by_email || '-' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 flex justify-end items-center space-x-3 pt-6 border-t border-gray-200">
              <button
                @click="handleDeleteQueueRow"
                class="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete & Next
              </button>
              <button
                @click="handleRejectRow"
                class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                @click="handleApproveRow"
                class="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Approve & Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'settings'" class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:p-6 space-y-6">
          <!-- Edit Dataset Info -->
          <div>
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Dataset Information</h3>

            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Dataset Name
                </label>
                <div class="flex space-x-2">
                  <input
                    v-model="editDatasetName"
                    type="text"
                    class="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Dataset name"
                  />
                  <button
                    @click="handleUpdateDataset"
                    :disabled="editDatasetName === datasetStore.currentDataset.name"
                    class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div class="flex space-x-2">
                  <textarea
                    v-model="editDatasetDescription"
                    rows="3"
                    class="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Dataset description"
                  ></textarea>
                  <button
                    @click="handleUpdateDataset"
                    :disabled="editDatasetDescription === datasetStore.currentDataset.description"
                    class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <!-- Read-only info -->
            <dl class="mt-6 space-y-4 pt-4 border-t border-gray-200">
              <div>
                <dt class="text-sm font-medium text-gray-500">Schema</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <router-link
                    :to="`/schemas/${datasetStore.currentDataset.schema_id}`"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    {{ currentSchemaName }}
                  </router-link>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Created</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(datasetStore.currentDataset.created_at) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(datasetStore.currentDataset.updated_at) }}</dd>
              </div>
            </dl>
          </div>

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium leading-6 text-red-900">Danger Zone</h3>
            <p class="mt-2 text-sm text-gray-500">
              Deleting a dataset will permanently remove all rows. This action cannot be undone.
            </p>
            <button
              @click="handleDelete"
              class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Delete Dataset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="closeImageModal"
    >
      <div class="flex min-h-screen items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity"></div>

        <!-- Modal Content -->
        <div class="relative z-50 max-w-7xl max-h-[90vh]">
          <div class="relative">
            <!-- Close button -->
            <button
              @click.stop="closeImageModal"
              class="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Image -->
            <img
              :src="modalImageUrl"
              alt="Full size image"
              class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              @click.stop
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Row Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="closeEditModal"
    >
      <div class="flex min-h-screen items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        <!-- Modal Content -->
        <div class="relative z-50 bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" @click.stop>
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Edit Row</h2>
            <button
              @click="closeEditModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6">
            <div v-if="editingRow" class="grid grid-cols-2 gap-6">
              <!-- Image -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">Image</h3>
                <div class="border rounded-lg overflow-hidden bg-gray-50">
                  <img
                    :src="editingRow.image_url"
                    :alt="editingRow.id"
                    class="w-full h-auto object-contain max-h-96 cursor-pointer"
                    @click="openImageModal(editingRow.image_url)"
                    @error="handleImageError"
                  />
                </div>
              </div>

              <!-- Row data (Editable) -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">Row Data</h3>
                <div class="space-y-4">
                  <div v-for="field in schemaFields" :key="field.id">
                    <!-- Boolean Field -->
                    <div v-if="field.type === 'boolean'">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <div class="flex items-center space-x-4">
                        <label class="flex items-center">
                          <input
                            v-model="editRowData[field.id]"
                            type="radio"
                            :value="true"
                            :name="`edit-field-${field.id}`"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span class="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label class="flex items-center">
                          <input
                            v-model="editRowData[field.id]"
                            type="radio"
                            :value="false"
                            :name="`edit-field-${field.id}`"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span class="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <!-- Text Field -->
                    <div v-else-if="field.type === 'text'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <textarea
                        v-if="field.config?.multiline"
                        v-model="editRowData[field.id]"
                        :required="field.required"
                        :maxlength="field.config?.max_length || 5000"
                        rows="3"
                        class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      ></textarea>
                      <input
                        v-else
                        v-model="editRowData[field.id]"
                        type="text"
                        :required="field.required"
                        :maxlength="field.config?.max_length || 5000"
                        class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <!-- Numeric Field -->
                    <div v-else-if="field.type === 'numeric'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <input
                        v-model.number="editRowData[field.id]"
                        :type="field.config?.decimal ? 'number' : 'number'"
                        :step="field.config?.decimal ? '0.01' : '1'"
                        :min="field.config?.min"
                        :max="field.config?.max"
                        :required="field.required"
                        class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <!-- Enum Field -->
                    <div v-else-if="field.type === 'enum'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ field.name }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="editRowData[field.id]"
                        :required="field.required"
                        class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select an option</option>
                        <option v-for="option in field.config?.options" :key="option" :value="option">
                          {{ option }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Metadata -->
                  <div class="mt-6 pt-4 border-t border-gray-300">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Metadata</h4>
                    <div class="space-y-2 text-sm text-gray-600">
                      <div>
                        <span class="font-medium">Status:</span>
                        <span
                          :class="[
                            'ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                            editingRow.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          ]"
                        >
                          {{ editingRow.status }}
                        </span>
                      </div>
                      <div>
                        <span class="font-medium">Created:</span> {{ formatDate(editingRow.created_at) }}
                      </div>
                      <div>
                        <span class="font-medium">Updated:</span> {{ formatDate(editingRow.updated_at) }}
                      </div>
                      <div v-if="editingRow.updated_by_email">
                        <span class="font-medium">Updated By:</span> {{ editingRow.updated_by_email }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              @click="closeEditModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="handleSaveEdit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDatasetStore } from '@/stores/datasetStore'
import { useSchemaStore } from '@/stores/schemaStore'
import { rowService } from '@/services/rowService'
import type { DatasetRow } from '@/types'

const route = useRoute()
const router = useRouter()
const datasetStore = useDatasetStore()
const schemaStore = useSchemaStore()

const activeTab = ref('rows')
const rows = ref<DatasetRow[]>([])
const rowsLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalRows = ref(0)

// Dataset edit state
const editDatasetName = ref('')
const editDatasetDescription = ref('')

// Export state
const showExportDropdown = ref(false)
const exportOnlyReviewed = ref(true)

// Queue state
const queueRows = ref<DatasetRow[]>([])
const queueLoading = ref(false)
const queueCurrentIndex = ref(0)
const queueTotal = ref(0)
const editableData = ref<Record<string, any>>({})

// Image modal state
const showImageModal = ref(false)
const modalImageUrl = ref('')

// Edit modal state
const showEditModal = ref(false)
const editingRow = ref<DatasetRow | null>(null)
const editRowData = ref<Record<string, any>>({})

const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value))

const schemaFields = computed(() => {
  if (!datasetStore.currentDataset?.schema_id) return []
  const schema = schemaStore.schemas.find(s => s.id === datasetStore.currentDataset?.schema_id)
  return schema?.fields || []
})

const reviewedCount = computed(() => {
  if (!datasetStore.currentDataset) return 0
  // rows_count now contains reviewed count (not total)
  return datasetStore.currentDataset.rows_count
})

const currentQueueRow = computed(() => {
  return queueRows.value[queueCurrentIndex.value] || null
})

const currentSchemaName = computed(() => {
  if (!datasetStore.currentDataset?.schema_id) return 'Unknown'
  const schema = schemaStore.schemas.find(s => s.id === datasetStore.currentDataset?.schema_id)
  return schema?.name || 'Unknown Schema'
})

onMounted(async () => {
  await datasetStore.fetchDataset(route.params.id as string)
  await schemaStore.fetchSchemas()
  await fetchRows()

  // Close dropdown when clicking outside
  document.addEventListener('click', handleClickOutside)
  // Close modal on Escape key
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
  // Restore body scroll in case modal was open
  document.body.style.overflow = ''
})

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showExportDropdown.value = false
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (showEditModal.value) {
      closeEditModal()
    } else if (showImageModal.value) {
      closeImageModal()
    }
  }
}

watch(currentPage, () => {
  fetchRows()
})

watch(activeTab, (newTab) => {
  if (newTab === 'queue' && queueRows.value.length === 0) {
    fetchQueue()
  }
})

watch(currentQueueRow, (newRow) => {
  if (newRow) {
    editableData.value = { ...newRow.data }
  } else {
    editableData.value = {}
  }
})

watch(() => datasetStore.currentDataset, (dataset) => {
  if (dataset) {
    editDatasetName.value = dataset.name
    editDatasetDescription.value = dataset.description || ''
  }
}, { immediate: true })

async function fetchRows() {
  if (!datasetStore.currentDataset) return

  rowsLoading.value = true
  try {
    const response = await rowService.list(
      datasetStore.currentDataset.id,
      currentPage.value,
      pageSize.value,
      'reviewed' // Only show reviewed rows in the main Rows tab
    )
    rows.value = response.items
    totalRows.value = response.total
  } catch (error) {
    console.error('Failed to fetch rows:', error)
  } finally {
    rowsLoading.value = false
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

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

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3EError%3C/text%3E%3C/svg%3E'
}

function openImageModal(imageUrl: string) {
  modalImageUrl.value = imageUrl
  showImageModal.value = true
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden'
}

function closeImageModal() {
  showImageModal.value = false
  modalImageUrl.value = ''
  // Restore body scroll
  document.body.style.overflow = ''
}

function openEditModal(row: DatasetRow) {
  editingRow.value = row
  editRowData.value = { ...row.data }
  showEditModal.value = true
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden'
}

function closeEditModal() {
  showEditModal.value = false
  editingRow.value = null
  editRowData.value = {}
  // Restore body scroll
  document.body.style.overflow = ''
}

async function handleSaveEdit() {
  if (!editingRow.value || !datasetStore.currentDataset) return

  try {
    await rowService.update(
      datasetStore.currentDataset.id,
      editingRow.value.id,
      {
        data: editRowData.value,
        status: editingRow.value.status
      }
    )

    // Refresh the rows list
    await fetchRows()

    // Close the modal
    closeEditModal()
  } catch (error) {
    console.error('Failed to update row:', error)
    alert('Failed to update row')
  }
}

async function handleDeleteRow(rowId: string) {
  if (!datasetStore.currentDataset) return

  if (confirm('Are you sure you want to delete this row?')) {
    try {
      await rowService.delete(datasetStore.currentDataset.id, rowId)
      await fetchRows()
      await datasetStore.fetchDataset(route.params.id as string)
    } catch (error) {
      console.error('Failed to delete row:', error)
      alert('Failed to delete row')
    }
  }
}

async function handleUpdateDataset() {
  if (!datasetStore.currentDataset) return

  try {
    await datasetStore.updateDataset(datasetStore.currentDataset.id, {
      name: editDatasetName.value,
      description: editDatasetDescription.value
    })
    alert('Dataset updated successfully')
  } catch (error: any) {
    console.error('Failed to update dataset:', error)
    alert(error.response?.data?.detail || 'Failed to update dataset')
  }
}

async function handleDownloadCSV(onlyReviewed: boolean) {
  if (!datasetStore.currentDataset) return

  // Update the preference
  exportOnlyReviewed.value = onlyReviewed

  // Close dropdown
  showExportDropdown.value = false

  try {
    const blob = await rowService.exportCSV(datasetStore.currentDataset.id, onlyReviewed)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const suffix = onlyReviewed ? '_reviewed' : '_all'
    link.download = `${datasetStore.currentDataset.name.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    console.error('Failed to export CSV:', error)
    alert('Failed to export CSV')
  }
}

async function handleDelete() {
  if (confirm('Are you sure you want to delete this dataset? This cannot be undone.')) {
    await datasetStore.deleteDataset(route.params.id as string)
    router.push('/datasets')
  }
}

// Queue functions
async function fetchQueue() {
  if (!datasetStore.currentDataset) return

  queueLoading.value = true
  try {
    // Fetch first page to get total count
    const firstPage = await rowService.getQueue(
      datasetStore.currentDataset.id,
      1,
      100
    )

    queueTotal.value = firstPage.total
    const allRows = [...firstPage.items]

    // Fetch remaining pages if needed
    const totalPages = Math.ceil(firstPage.total / 100)
    if (totalPages > 1) {
      const pagePromises = []
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          rowService.getQueue(datasetStore.currentDataset.id, page, 100)
        )
      }

      const remainingPages = await Promise.all(pagePromises)
      remainingPages.forEach(pageData => {
        allRows.push(...pageData.items)
      })
    }

    queueRows.value = allRows
    queueCurrentIndex.value = 0
  } catch (error) {
    console.error('Failed to fetch queue:', error)
  } finally {
    queueLoading.value = false
  }
}

function prevQueueRow() {
  if (queueCurrentIndex.value > 0) {
    queueCurrentIndex.value--
  }
}

function nextQueueRow() {
  if (queueCurrentIndex.value < queueTotal.value - 1) {
    queueCurrentIndex.value++
  }
}

async function handleApproveRow() {
  if (!currentQueueRow.value || !datasetStore.currentDataset) return

  try {
    // Update row with edited data and mark as reviewed
    await rowService.update(
      datasetStore.currentDataset.id,
      currentQueueRow.value.id,
      {
        data: editableData.value,
        status: 'reviewed'
      }
    )

    // Remove from queue
    queueRows.value.splice(queueCurrentIndex.value, 1)
    queueTotal.value--

    // Adjust index if needed
    if (queueCurrentIndex.value >= queueRows.value.length && queueCurrentIndex.value > 0) {
      queueCurrentIndex.value--
    }

    // Refresh dataset counts
    await datasetStore.fetchDataset(route.params.id as string)
  } catch (error) {
    console.error('Failed to approve row:', error)
    alert('Failed to approve row')
  }
}

async function handleRejectRow() {
  // Just move to next without changing status
  nextQueueRow()
}

async function handleDeleteQueueRow() {
  if (!currentQueueRow.value || !datasetStore.currentDataset) return

  if (confirm('Are you sure you want to delete this row?')) {
    try {
      await rowService.delete(datasetStore.currentDataset.id, currentQueueRow.value.id)

      // Remove from queue
      queueRows.value.splice(queueCurrentIndex.value, 1)
      queueTotal.value--

      // Adjust index if needed
      if (queueCurrentIndex.value >= queueRows.value.length && queueCurrentIndex.value > 0) {
        queueCurrentIndex.value--
      }

      // Refresh dataset counts
      await datasetStore.fetchDataset(route.params.id as string)
    } catch (error) {
      console.error('Failed to delete row:', error)
      alert('Failed to delete row')
    }
  }
}
</script>
