<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
          <p class="mt-1 text-sm text-gray-500">Manage team users and permissions</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <i class="pi pi-plus mr-2"></i>
          Add User
        </button>
      </div>

      <!-- Users table -->
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-500">Loading users...</p>
        </div>

        <div v-else-if="users.length === 0" class="text-center py-12">
          <i class="pi pi-users text-4xl text-gray-400"></i>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No users</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by adding a user.</p>
        </div>

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    user.must_reset_pwd ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  ]"
                >
                  {{ user.must_reset_pwd ? 'Must Reset Password' : 'Active' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  @click="openEditModal(user)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  @click="handleResetPassword(user)"
                  class="text-yellow-600 hover:text-yellow-900"
                >
                  Reset Password
                </button>
                <button
                  @click="handleDelete(user)"
                  class="text-red-600 hover:text-red-900"
                  :disabled="user.id === currentUser?.id"
                  :class="{ 'opacity-50 cursor-not-allowed': user.id === currentUser?.id }"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to
                <span class="font-medium">{{ Math.min(currentPage * pageSize, total) }}</span> of
                <span class="font-medium">{{ total }}</span> users
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <i class="pi pi-chevron-left"></i>
                </button>
                <button
                  @click="currentPage++"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <i class="pi pi-chevron-right"></i>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showCreateModal = false"></div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Create New User</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  v-model="createForm.email"
                  type="email"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Role</label>
                <select
                  v-model="createForm.role"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p class="text-sm text-blue-800">
                  <i class="pi pi-info-circle mr-2"></i>
                  A temporary password will be generated and must be changed on first login.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="handleCreate"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              Create User
            </button>
            <button
              @click="showCreateModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal && editingUser" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showEditModal = false"></div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Edit User</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  :value="editingUser.email"
                  type="email"
                  disabled
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Role</label>
                <select
                  v-model="editForm.role"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="handleUpdate"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              Update User
            </button>
            <button
              @click="showEditModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Temp Password Modal -->
    <div v-if="showTempPasswordModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showTempPasswordModal = false"></div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <i class="pi pi-check text-green-600"></i>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Temporary Password</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">Please save this temporary password. The user will be required to change it on first login.</p>
                  <div class="mt-4 p-4 bg-gray-100 rounded-md">
                    <code class="text-lg font-mono">{{ tempPassword }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="copyTempPassword"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              <i class="pi pi-copy mr-2"></i>
              Copy Password
            </button>
            <button
              @click="showTempPasswordModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { userService } from '@/services/userService'
import type { User } from '@/types'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const users = ref<User[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showTempPasswordModal = ref(false)
const tempPassword = ref('')
const editingUser = ref<User | null>(null)

const createForm = ref({
  email: '',
  role: 'user' as 'admin' | 'user'
})

const editForm = ref({
  role: 'user' as 'admin' | 'user'
})

const currentUser = computed(() => authStore.user)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

onMounted(async () => {
  // Check if user is admin
  if (!authStore.user || authStore.user.role !== 'admin') {
    alert('Admin access required')
    router.push('/datasets')
    return
  }

  await fetchUsers()
})

watch(currentPage, () => {
  fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  try {
    const response = await userService.list(currentPage.value, pageSize.value)
    users.value = response.items
    total.value = response.total
  } catch (error) {
    console.error('Failed to fetch users:', error)
    alert('Failed to fetch users')
  } finally {
    loading.value = false
  }
}

function generateRandomPassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

async function handleCreate() {
  if (!createForm.value.email) {
    alert('Please enter an email')
    return
  }

  try {
    // Generate random password
    const randomPassword = generateRandomPassword()

    const response = await userService.create({
      ...createForm.value,
      password: randomPassword
    })
    tempPassword.value = response.temp_password
    showCreateModal.value = false
    showTempPasswordModal.value = true

    // Reset form
    createForm.value = {
      email: '',
      role: 'user'
    }

    await fetchUsers()
  } catch (error: any) {
    console.error('Failed to create user:', error)
    alert(error.response?.data?.detail || 'Failed to create user')
  }
}

function openEditModal(user: User) {
  editingUser.value = user
  editForm.value.role = user.role as 'admin' | 'user'
  showEditModal.value = true
}

async function handleUpdate() {
  if (!editingUser.value) return

  try {
    await userService.update(editingUser.value.id, editForm.value)
    showEditModal.value = false
    await fetchUsers()
  } catch (error: any) {
    console.error('Failed to update user:', error)
    alert(error.response?.data?.detail || 'Failed to update user')
  }
}

async function handleDelete(user: User) {
  if (user.id === currentUser.value?.id) {
    alert('You cannot delete your own account')
    return
  }

  if (confirm(`Are you sure you want to delete ${user.email}?`)) {
    try {
      await userService.delete(user.id)
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      alert(error.response?.data?.detail || 'Failed to delete user')
    }
  }
}

async function handleResetPassword(user: User) {
  if (confirm(`Reset password for ${user.email}?`)) {
    try {
      const response = await userService.resetPassword(user.id)
      tempPassword.value = response.temp_password
      showTempPasswordModal.value = true
      await fetchUsers()
    } catch (error: any) {
      console.error('Failed to reset password:', error)
      alert(error.response?.data?.detail || 'Failed to reset password')
    }
  }
}

function copyTempPassword() {
  navigator.clipboard.writeText(tempPassword.value)
  alert('Password copied to clipboard')
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>
