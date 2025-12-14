<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />
    <div class="flex pt-16">
      <Sidebar />
      <main class="flex-1 p-6 ml-64">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
</script>
