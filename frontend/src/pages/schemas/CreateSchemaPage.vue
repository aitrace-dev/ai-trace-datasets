<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Create Schema</h1>

      <!-- Info box explaining schema -->
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              A schema defines the structure of your dataset, like a database table. Define custom fields to store metadata for each image. System fields (image_url, created_at, created_by) are automatically included.
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow sm:rounded-lg">
        <form @submit.prevent="handleSubmit" class="space-y-6 p-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Schema Name <span class="text-red-500">*</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="e.g., Product Images, User Avatars, Training Data"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Schema Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="e.g., Schema for storing product catalog images with quality approval workflow"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <!-- Default System Fields Info -->
          <div class="border border-gray-300 rounded-md p-4 bg-gray-50">
            <h3 class="text-sm font-medium text-gray-900 mb-3">System Fields (Automatically Included)</h3>
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-center">
                <span class="font-mono bg-gray-200 px-2 py-1 rounded text-xs mr-2">image_url</span>
                <span>String - URL of the image (required)</span>
              </div>
              <div class="flex items-center">
                <span class="font-mono bg-gray-200 px-2 py-1 rounded text-xs mr-2">created_at</span>
                <span>Datetime - When the row was created</span>
              </div>
              <div class="flex items-center">
                <span class="font-mono bg-gray-200 px-2 py-1 rounded text-xs mr-2">created_by</span>
                <span>User - Who created the row</span>
              </div>
              <div class="flex items-center">
                <span class="font-mono bg-gray-200 px-2 py-1 rounded text-xs mr-2">updated_at</span>
                <span>Datetime - Last update timestamp</span>
              </div>
              <div class="flex items-center">
                <span class="font-mono bg-gray-200 px-2 py-1 rounded text-xs mr-2">updated_by</span>
                <span>User - Who last updated the row</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Custom Fields <span class="text-red-500">*</span>
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              Define additional fields to store metadata for each image. At least one custom field is required.
            </p>
            <div class="space-y-4">
              <div
                v-for="(field, index) in form.fields"
                :key="index"
                class="border border-gray-300 rounded-md p-4 bg-white"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">
                      Field Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="field.name"
                      type="text"
                      required
                      placeholder="e.g., is_approved, category, price"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p class="mt-1 text-xs text-gray-500">Alphanumeric characters and spaces only</p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700">
                      Data Type <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="field.type"
                      required
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="boolean">Boolean (true/false)</option>
                      <option value="text">Text (string)</option>
                      <option value="numeric">Numeric (integer/decimal)</option>
                      <option value="enum">Enum (predefined options)</option>
                    </select>
                  </div>
                </div>

                <!-- Enum options configuration -->
                <div v-if="field.type === 'enum'" class="mt-4 border-t border-gray-200 pt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Enum Options <span class="text-red-500">*</span>
                  </label>
                  <p class="text-xs text-gray-600 mb-3">Define the allowed values for this field. At least 2 options required.</p>

                  <div class="space-y-2">
                    <div
                      v-for="(option, optIndex) in getEnumOptions(field)"
                      :key="optIndex"
                      class="flex items-center gap-2"
                    >
                      <input
                        v-model="field.config.options[optIndex]"
                        type="text"
                        required
                        placeholder="e.g., Pending, Approved, Rejected"
                        class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        @click="removeEnumOption(field, optIndex)"
                        :disabled="getEnumOptions(field).length <= 2"
                        class="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed px-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="addEnumOption(field)"
                    class="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add option
                  </button>
                </div>

                <!-- Text field configuration -->
                <div v-if="field.type === 'text'" class="mt-4 border-t border-gray-200 pt-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="flex items-center text-sm">
                        <input
                          v-model="field.config.multiline"
                          type="checkbox"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span class="ml-2 text-gray-700">Multiline (textarea)</span>
                      </label>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-700">Max Length</label>
                      <input
                        v-model.number="field.config.max_length"
                        type="number"
                        min="1"
                        max="10000"
                        placeholder="5000"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <!-- Numeric field configuration -->
                <div v-if="field.type === 'numeric'" class="mt-4 border-t border-gray-200 pt-4">
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="flex items-center text-sm">
                        <input
                          v-model="field.config.decimal"
                          type="checkbox"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span class="ml-2 text-gray-700">Allow decimals</span>
                      </label>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-700">Min Value</label>
                      <input
                        v-model.number="field.config.min"
                        type="number"
                        placeholder="Optional"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-gray-700">Max Value</label>
                      <input
                        v-model.number="field.config.max"
                        type="number"
                        placeholder="Optional"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div class="mt-3 flex items-center justify-between">
                  <label class="flex items-center">
                    <input
                      v-model="field.required"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700">Required field</span>
                    <span class="ml-1 text-xs text-gray-500">(must be filled for row to be marked as reviewed)</span>
                  </label>

                  <button
                    type="button"
                    @click="removeField(index)"
                    :disabled="form.fields.length === 1"
                    class="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Remove Field
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="addField"
              class="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Add Field
            </button>
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="handleCancel"
              class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="schemaStore.loading"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ schemaStore.loading ? 'Creating...' : 'Create Schema' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useSchemaStore } from '@/stores/schemaStore'

const router = useRouter()
const route = useRoute()
const schemaStore = useSchemaStore()

const form = ref({
  name: '',
  description: '',
  fields: [
    // Default field to get users started
    {
      name: 'is_approved',
      type: 'boolean' as 'text' | 'numeric' | 'boolean' | 'enum',
      required: true,
      config: {},
    }
  ] as Array<{
    name: string
    type: 'text' | 'numeric' | 'boolean' | 'enum'
    required: boolean
    config: Record<string, any>
  }>,
})

const error = ref<string | null>(null)

function addField() {
  form.value.fields.push({
    name: '',
    type: 'boolean',
    required: true,
    config: {},
  })
}

function removeField(index: number) {
  // Prevent removing the last field
  if (form.value.fields.length > 1) {
    form.value.fields.splice(index, 1)
  }
}

function getEnumOptions(field: any): string[] {
  // Initialize options array if it doesn't exist or ensure minimum 2 options
  if (!field.config.options || !Array.isArray(field.config.options)) {
    field.config.options = ['', '']
  } else if (field.config.options.length < 2) {
    while (field.config.options.length < 2) {
      field.config.options.push('')
    }
  }
  return field.config.options
}

function addEnumOption(field: any) {
  if (!field.config.options) {
    field.config.options = []
  }
  field.config.options.push('')
}

function removeEnumOption(field: any, index: number) {
  if (field.config.options && field.config.options.length > 2) {
    field.config.options.splice(index, 1)
  }
}

function handleCancel() {
  const returnTo = route.query.returnTo as string
  if (returnTo === 'dataset') {
    router.push('/datasets/new')
  } else {
    router.push('/schemas')
  }
}

async function handleSubmit() {
  error.value = null

  // Validate at least one field
  if (form.value.fields.length === 0) {
    error.value = 'At least one custom field is required'
    return
  }

  // Validate all fields have names
  const hasEmptyFieldNames = form.value.fields.some(f => !f.name.trim())
  if (hasEmptyFieldNames) {
    error.value = 'All fields must have a name'
    return
  }

  // Validate enum fields have at least 2 non-empty options
  for (const field of form.value.fields) {
    if (field.type === 'enum') {
      const options = field.config.options || []
      const nonEmptyOptions = options.filter((opt: string) => opt.trim())

      if (nonEmptyOptions.length < 2) {
        error.value = `Enum field "${field.name}" must have at least 2 options`
        return
      }

      // Check for duplicate options
      const uniqueOptions = new Set(nonEmptyOptions.map((opt: string) => opt.trim().toLowerCase()))
      if (uniqueOptions.size !== nonEmptyOptions.length) {
        error.value = `Enum field "${field.name}" has duplicate options`
        return
      }
    }
  }

  try {
    // Assign positions to fields based on their order
    const schemaData = {
      ...form.value,
      fields: form.value.fields.map((field, index) => ({
        ...field,
        position: index,
      })),
    }

    const schema = await schemaStore.createSchema(schemaData)

    // Check if we need to return to dataset creation
    const returnTo = route.query.returnTo as string
    if (returnTo === 'dataset' && schema?.id) {
      router.push(`/datasets/new?schema_id=${schema.id}`)
    } else {
      router.push('/schemas')
    }
  } catch (err) {
    error.value = 'Failed to create schema'
  }
}
</script>
