<template>
  <aside class="fixed left-0 top-14 z-20 w-64 h-screen pt-6 bg-white border-r border-gray-200">
    <div class="h-full px-3 pb-4 overflow-y-auto">
      <ul class="space-y-2 font-medium">
        <li>
          <router-link
            to="/datasets"
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
            :class="{ 'bg-blue-50 text-blue-600': $route.path.startsWith('/datasets') }"
          >
            <i class="pi pi-database"></i>
            <span class="ml-3">Datasets</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/schemas"
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
            :class="{ 'bg-blue-50 text-blue-600': $route.path.startsWith('/schemas') }"
          >
            <i class="pi pi-table"></i>
            <span class="ml-3">Schemas</span>
          </router-link>
        </li>
        <li v-if="authStore.isAdmin">
          <router-link
            to="/users"
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
            :class="{ 'bg-blue-50 text-blue-600': $route.path.startsWith('/users') }"
          >
            <i class="pi pi-users"></i>
            <span class="ml-3">Users</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/settings"
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
            :class="{ 'bg-blue-50 text-blue-600': $route.path === '/settings' }"
          >
            <i class="pi pi-cog"></i>
            <span class="ml-3">Settings</span>
          </router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
</script>
