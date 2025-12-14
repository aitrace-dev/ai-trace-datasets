<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>

      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Profile</h3>
          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <p class="mt-1 text-sm text-gray-900">{{ authStore.user?.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Role</label>
              <p class="mt-1 text-sm text-gray-900">{{ authStore.user?.role }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
          <form @submit.prevent="handleChangePassword" class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Old Password</label>
              <input
                v-model="oldPassword"
                type="password"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">New Password</label>
              <input
                v-model="newPassword"
                type="password"
                minlength="8"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div v-if="message" class="text-sm" :class="messageType === 'success' ? 'text-green-600' : 'text-red-600'">
              {{ message }}
            </div>
            <button
              type="submit"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

async function handleChangePassword() {
  message.value = ''

  try {
    await authStore.changePassword(oldPassword.value, newPassword.value)
    messageType.value = 'success'
    message.value = 'Password changed successfully'
    oldPassword.value = ''
    newPassword.value = ''
  } catch {
    messageType.value = 'error'
    message.value = 'Failed to change password'
  }
}
</script>
