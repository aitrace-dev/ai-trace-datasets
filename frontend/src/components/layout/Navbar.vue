<template>
  <nav class="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
    <div class="px-4 py-3 lg:px-6 lg:pl-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-start">
          <span class="text-xl font-semibold text-primary-600">AITrace Datasets</span>
        </div>
        <div class="flex items-center">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center text-sm bg-gray-100 rounded-lg p-2 hover:bg-gray-200"
          >
            <span class="mr-2">{{ authStore.user?.email }}</span>
            <i class="pi pi-angle-down"></i>
          </button>
          <div
            v-if="showUserMenu"
            class="absolute right-4 top-14 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
          >
            <router-link
              to="/settings"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="showUserMenu = false"
            >
              Settings
            </router-link>
            <button
              @click="handleLogout"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()
const showUserMenu = ref(false)

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
