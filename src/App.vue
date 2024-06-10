<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineExpose } from 'vue'
import { fetchData } from './app'

const fetchedData = ref([])
const error = ref(null)
let intervalId = null

onMounted(async () => {
  try {
    const data = await fetchData()
    if (JSON.stringify(data) !== JSON.stringify(fetchedData.value)) {
      fetchedData.value = data
    }
  } catch (err) {
    error.value = err.message
  }

  intervalId = setInterval(async () => {
    try {
      const data = await fetchData()
      if (JSON.stringify(data) !== JSON.stringify(fetchedData.value)) {
        fetchedData.value = data
      }
    } catch (err) {
      error.value = err.message
    }
  }, 5000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})

defineExpose({ fetchedData, error })
</script>

<template>
  <div v-if="error">
    <p>Error: {{ error }}</p>
  </div>
  <div v-else-if="fetchedData && fetchedData.length">
    <div>
      <p>Temperature: {{ fetchedData[fetchedData.length - 1].temperature }}</p>
      <p>Humidity: {{ fetchedData[fetchedData.length - 1].humidity }}</p>
      <p>IP Address: {{ fetchedData[fetchedData.length - 1].ip_address }}</p>
    </div>
  </div>
  <div v-else>
    <p>Loading...</p>
  </div>
</template>

<style scoped>
/* Your styles here */
</style>
