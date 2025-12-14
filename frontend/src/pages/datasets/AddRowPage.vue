<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <router-link
            :to="`/datasets/${datasetId}`"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900">Add Rows to Dataset</h1>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'single'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Single Row Entry
          </button>
          <button
            @click="activeTab = 'bulk'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Bulk CSV Upload
          </button>
        </nav>
      </div>

      <!-- Single Row Entry -->
      <div v-if="activeTab === 'single'">
        <div class="bg-white shadow sm:rounded-lg p-6">
          <div class="grid grid-cols-2 gap-6">
            <!-- Left: Image Preview -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-4">Image Preview</h3>

              <!-- Image URL Input -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Image URL <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.image_url"
                  type="url"
                  required
                  placeholder="https://example.com/image.jpg"
                  @input="loadImage"
                  class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p class="mt-1 text-xs text-gray-500">Enter the URL of the image to add</p>
              </div>

              <!-- Image Preview Area -->
              <div class="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50" style="min-height: 400px;">
                <div v-if="imageLoading" class="flex items-center justify-center h-64">
                  <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p class="text-sm text-gray-500">Loading image...</p>
                  </div>
                </div>
                <div v-else-if="imageError" class="flex items-center justify-center h-64">
                  <div class="text-center text-red-600">
                    <svg class="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p class="text-sm">{{ imageError }}</p>
                  </div>
                </div>
                <img
                  v-else-if="form.image_url && imagePreviewUrl"
                  :src="imagePreviewUrl"
                  alt="Preview"
                  class="w-full h-auto object-contain"
                  @error="handleImageError"
                />
                <div v-else class="flex items-center justify-center h-64 text-gray-400">
                  <div class="text-center">
                    <svg class="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p class="text-sm">Enter an image URL to preview</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Form Fields -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-4">Row Data</h3>

              <div v-if="schema" class="space-y-4">
                <!-- Dynamic fields based on schema -->
                <div v-for="field in schema.fields" :key="field.id">
                  <!-- Boolean Field -->
                  <div v-if="field.type === 'boolean'">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      {{ field.name }}
                      <span v-if="field.required" class="text-red-500">*</span>
                    </label>
                    <div class="flex items-center space-x-4">
                      <label class="flex items-center">
                        <input
                          v-model="form.data[field.id]"
                          type="radio"
                          :value="true"
                          :name="`field-${field.id}`"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span class="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          v-model="form.data[field.id]"
                          type="radio"
                          :value="false"
                          :name="`field-${field.id}`"
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
                      v-model="form.data[field.id]"
                      :required="field.required"
                      :maxlength="field.config?.max_length || 5000"
                      rows="3"
                      class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    ></textarea>
                    <input
                      v-else
                      v-model="form.data[field.id]"
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
                      v-model.number="form.data[field.id]"
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
                      v-model="form.data[field.id]"
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
              </div>

              <div v-else class="text-gray-500">Loading schema...</div>

              <!-- Error message -->
              <div v-if="error" class="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <p class="text-sm text-red-700">{{ error }}</p>
              </div>

              <!-- Success message -->
              <div v-if="successMessage" class="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
                <p class="text-sm text-green-700">{{ successMessage }}</p>
              </div>

              <!-- Actions -->
              <div class="mt-6 flex justify-end space-x-3">
                <button
                  @click="resetForm"
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  @click="handleSubmit"
                  :disabled="loading"
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {{ loading ? 'Saving...' : 'Save & Add Another' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk CSV Upload -->
      <div v-else-if="activeTab === 'bulk'">
        <div class="bg-white shadow sm:rounded-lg p-6">
          <div class="max-w-4xl mx-auto">
            <!-- Step 1: File Upload -->
            <div v-if="csvStep === 1">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Step 1: Upload CSV File</h3>
              <p class="text-sm text-gray-600 mb-6">
                Upload a CSV file containing multiple rows. The first row should contain column headers that you'll map to schema fields.
              </p>

              <!-- File upload area -->
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="mt-4">
                  <label class="cursor-pointer">
                    <span class="mt-2 block text-sm font-medium text-blue-600 hover:text-blue-500">
                      Upload a CSV file
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      @change="handleFileUpload"
                      class="hidden"
                    />
                  </label>
                  <p class="mt-1 text-xs text-gray-500">CSV files only</p>
                </div>
              </div>

              <div v-if="csvFile" class="mt-4">
                <p class="text-sm text-gray-700">Selected file: <strong>{{ csvFile.name }}</strong></p>
                <button
                  @click="parseCSV"
                  class="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Next: Map Columns
                </button>
              </div>

              <!-- CSV Processing Info -->
              <div class="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-blue-700">
                      <strong>CSV Format:</strong> Include columns for image_url and your custom fields. The system will:
                    </p>
                    <ul class="mt-2 text-sm text-blue-700 list-disc list-inside">
                      <li>Skip duplicate images (same image URL)</li>
                      <li>Skip corrupted/invalid images</li>
                      <li>Auto-calculate row status based on required fields (unless marked as pending)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2: Column Mapping -->
            <div v-else-if="csvStep === 2">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Step 2: Map CSV Columns to Fields</h3>
              <p class="text-sm text-gray-600 mb-6">
                Map your CSV columns to the dataset fields. The image_url field is required.
              </p>

              <div class="space-y-4">
                <!-- Image URL mapping (required) -->
                <div class="bg-gray-50 p-4 rounded-lg">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Image URL Column <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="columnMapping['image_url']"
                    class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">-- Select CSV Column --</option>
                    <option v-for="col in csvColumns" :key="col" :value="col">
                      {{ col }}
                    </option>
                  </select>
                </div>

                <!-- Schema fields mapping -->
                <div v-for="field in schema?.fields" :key="field.id" class="bg-gray-50 p-4 rounded-lg">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ field.name }} ({{ field.type }})
                    <span v-if="field.required" class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="columnMapping[field.id]"
                    class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">-- Select CSV Column --</option>
                    <option v-for="col in csvColumns" :key="col" :value="col">
                      {{ col }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Mark all as pending option -->
              <div class="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div class="flex items-center">
                  <input
                    v-model="markAllAsPending"
                    type="checkbox"
                    id="markAllAsPending"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label for="markAllAsPending" class="ml-3 text-sm text-yellow-700">
                    <strong>Mark all rows as pending</strong> - Override automatic status calculation and mark all imported rows as pending
                  </label>
                </div>
              </div>

              <!-- Preview -->
              <div v-if="csvPreview.length > 0" class="mt-6">
                <h4 class="text-sm font-medium text-gray-900 mb-2">Preview (first 3 rows)</h4>
                <div class="overflow-x-auto border rounded-lg">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image URL</th>
                        <th v-for="field in schema?.fields" :key="field.id" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {{ field.name }}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="(row, idx) in csvPreview" :key="idx">
                        <td class="px-4 py-2 text-sm text-gray-900">{{ row[columnMapping['image_url']] || '-' }}</td>
                        <td v-for="field in schema?.fields" :key="field.id" class="px-4 py-2 text-sm text-gray-900">
                          {{ row[columnMapping[field.id]] || '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Error message -->
              <div v-if="csvError" class="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <p class="text-sm text-red-700">{{ csvError }}</p>
              </div>

              <!-- Import Progress -->
              <div v-if="csvImporting" class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center justify-center mb-4">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span class="ml-3 text-lg font-medium text-blue-900">Importing rows...</span>
                </div>
                <div class="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                  <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" :style="{ width: importProgress + '%' }"></div>
                </div>
                <p class="mt-3 text-center text-sm text-blue-700">
                  Processing {{ csvData.length }} rows. This may take a moment...
                </p>
              </div>

              <!-- Actions -->
              <div v-if="!csvImporting" class="mt-6 flex justify-between">
                <button
                  @click="resetCSV"
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  @click="importCSV"
                  :disabled="!columnMapping['image_url']"
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Import Rows
                </button>
              </div>
            </div>

            <!-- Step 3: Results -->
            <div v-else-if="csvStep === 3">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Import Complete</h3>

              <div class="space-y-4">
                <!-- Success metrics -->
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-green-600">{{ csvResults.imported }}</div>
                    <div class="text-sm text-green-700">Imported</div>
                  </div>
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-yellow-600">{{ csvResults.skipped_duplicates }}</div>
                    <div class="text-sm text-yellow-700">Skipped (Duplicates)</div>
                  </div>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-red-600">{{ csvResults.skipped_invalid }}</div>
                    <div class="text-sm text-red-700">Skipped (Invalid)</div>
                  </div>
                </div>

                <!-- Errors -->
                <div v-if="csvResults.errors && csvResults.errors.length > 0" class="mt-4">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Errors:</h4>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <ul class="text-sm text-red-700 space-y-1">
                      <li v-for="(err, idx) in csvResults.errors" :key="idx">{{ err }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-6 flex justify-end space-x-3">
                <button
                  @click="resetCSV"
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Import Another File
                </button>
                <router-link
                  :to="`/datasets/${datasetId}`"
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Dataset
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDatasetStore } from '@/stores/datasetStore'
import { useSchemaStore } from '@/stores/schemaStore'
import { rowService } from '@/services/rowService'
import type { SchemaResponse } from '@/types'

const route = useRoute()
const datasetStore = useDatasetStore()
const schemaStore = useSchemaStore()

const datasetId = route.params.id as string
const activeTab = ref<'single' | 'bulk'>('single')
const schema = ref<SchemaResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Single row form
const form = reactive({
  image_url: '',
  data: {} as Record<string, any>
})

const imageLoading = ref(false)
const imageError = ref<string | null>(null)
const imagePreviewUrl = ref<string | null>(null)

// CSV upload
const csvFile = ref<File | null>(null)
const csvStep = ref(1) // 1: upload, 2: mapping, 3: results
const csvColumns = ref<string[]>([])
const csvData = ref<any[]>([])
const csvPreview = ref<any[]>([])
const columnMapping = ref<Record<string, string>>({})
const markAllAsPending = ref(false)
const csvError = ref<string | null>(null)
const csvImporting = ref(false)
const importProgress = ref(0)
const csvResults = ref({
  imported: 0,
  skipped_duplicates: 0,
  skipped_invalid: 0,
  errors: []
})

onMounted(async () => {
  // Fetch dataset to get schema
  const dataset = await datasetStore.fetchDataset(datasetId)
  if (dataset?.schema_id) {
    schema.value = await schemaStore.fetchSchema(dataset.schema_id)
    // Initialize form data for all fields
    schema.value?.fields?.forEach(field => {
      if (field.type === 'boolean') {
        // Don't set a default for required fields - force user selection
        if (!field.required) {
          form.data[field.id] = false
        }
      } else {
        form.data[field.id] = ''
      }
    })
  }
})

async function loadImage() {
  if (!form.image_url) {
    imagePreviewUrl.value = null
    return
  }

  imageLoading.value = true
  imageError.value = null

  try {
    // Try to load the image
    const img = new Image()
    img.onload = () => {
      imagePreviewUrl.value = form.image_url
      imageLoading.value = false
    }
    img.onerror = () => {
      imageError.value = 'Failed to load image. Please check the URL.'
      imageLoading.value = false
    }
    img.src = form.image_url
  } catch (err) {
    imageError.value = 'Invalid image URL'
    imageLoading.value = false
  }
}

function handleImageError() {
  imageError.value = 'Failed to load image'
}

async function handleSubmit() {
  error.value = null
  successMessage.value = null

  console.log('Submit clicked')
  console.log('Image URL:', form.image_url)
  console.log('Image Preview URL:', imagePreviewUrl.value)
  console.log('Form Data:', form.data)
  console.log('Schema:', schema.value)

  // Validate image URL
  if (!form.image_url) {
    error.value = 'Image URL is required'
    console.log('Validation failed: No image URL')
    return
  }

  if (!imagePreviewUrl.value) {
    error.value = 'Please enter a valid image URL and wait for it to load'
    console.log('Validation failed: Image not loaded')
    return
  }

  // Validate required fields
  if (schema.value) {
    const missingFields: string[] = []

    for (const field of schema.value.fields || []) {
      if (field.required) {
        const value = form.data[field.id]
        console.log(`Checking field ${field.name} (${field.type}):`, value)

        // For boolean fields, false is a valid value
        if (field.type === 'boolean') {
          // Boolean must be explicitly set (true or false)
          if (value === undefined || value === null) {
            missingFields.push(field.name)
          }
        } else {
          // For other types, check if empty
          if (value === undefined || value === null || value === '') {
            missingFields.push(field.name)
          }
        }
      }
    }

    if (missingFields.length > 0) {
      error.value = `Please fill in required fields: ${missingFields.join(', ')}`
      console.log('Validation failed: Missing fields:', missingFields)
      return
    }
  }

  console.log('Validation passed, making API call...')
  loading.value = true

  try {
    await datasetStore.createRow(datasetId, {
      image_url: form.image_url,
      data: form.data
    })

    successMessage.value = 'Row added successfully!'

    // Reset form for next entry
    setTimeout(() => {
      resetForm()
      successMessage.value = null
    }, 2000)
  } catch (err: any) {
    console.error('API Error:', err)
    const errorMessage = err.response?.data?.detail
    if (typeof errorMessage === 'string') {
      error.value = errorMessage
    } else if (Array.isArray(errorMessage)) {
      // Handle Pydantic validation errors
      error.value = errorMessage.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
    } else {
      error.value = 'Failed to add row: ' + (err.message || 'Unknown error')
    }
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.image_url = ''
  imagePreviewUrl.value = null
  imageError.value = null
  schema.value?.fields?.forEach(field => {
    if (field.type === 'boolean') {
      // Don't set a default for required fields - force user selection
      if (!field.required) {
        form.data[field.id] = false
      } else {
        delete form.data[field.id]
      }
    } else {
      form.data[field.id] = ''
    }
  })
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    csvFile.value = target.files[0]
  }
}

async function parseCSV() {
  if (!csvFile.value) return

  csvError.value = null

  try {
    const text = await csvFile.value.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      csvError.value = 'CSV file must have at least a header row and one data row'
      return
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    csvColumns.value = headers

    // Parse data
    const data: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      data.push(row)
    }

    csvData.value = data
    csvPreview.value = data.slice(0, 3)

    // Auto-map columns if names match
    columnMapping.value = {}
    if (headers.includes('image_url')) {
      columnMapping.value['image_url'] = 'image_url'
    }

    schema.value?.fields?.forEach(field => {
      if (headers.includes(field.name)) {
        columnMapping.value[field.id] = field.name
      }
    })

    csvStep.value = 2
  } catch (err: any) {
    csvError.value = 'Failed to parse CSV: ' + err.message
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

async function importCSV() {
  if (!columnMapping.value['image_url']) {
    csvError.value = 'Image URL column mapping is required'
    return
  }

  csvImporting.value = true
  csvError.value = null
  importProgress.value = 0

  // Simulate progress
  const progressInterval = setInterval(() => {
    if (importProgress.value < 90) {
      // Gradually increase progress, slowing down as it approaches 90%
      const increment = Math.max(1, (90 - importProgress.value) / 10)
      importProgress.value = Math.min(90, importProgress.value + increment)
    }
  }, 200)

  try {
    // Build CSV content from data
    const headers = csvColumns.value
    let csvContent = headers.join(',') + '\n'
    csvData.value.forEach(row => {
      const values = headers.map(h => {
        const val = row[h] || ''
        return val.includes(',') ? `"${val}"` : val
      })
      csvContent += values.join(',') + '\n'
    })

    // Call import API
    const response = await rowService.importCSV(datasetId, {
      file_content: csvContent,
      column_mapping: columnMapping.value,
      mark_all_pending: markAllAsPending.value
    })

    // Complete progress
    clearInterval(progressInterval)
    importProgress.value = 100

    // Show 100% briefly before moving to results
    await new Promise(resolve => setTimeout(resolve, 500))

    csvResults.value = response
    csvStep.value = 3

    // Refresh dataset counts
    await datasetStore.fetchDataset(datasetId)
  } catch (err: any) {
    clearInterval(progressInterval)
    console.error('Import error:', err)
    csvError.value = err.response?.data?.detail || 'Failed to import CSV'
  } finally {
    csvImporting.value = false
    importProgress.value = 0
  }
}

function resetCSV() {
  csvFile.value = null
  csvStep.value = 1
  csvColumns.value = []
  csvData.value = []
  csvPreview.value = []
  columnMapping.value = {}
  markAllAsPending.value = false
  csvError.value = null
  csvResults.value = {
    imported: 0,
    skipped_duplicates: 0,
    skipped_invalid: 0,
    errors: []
  }
}
</script>
