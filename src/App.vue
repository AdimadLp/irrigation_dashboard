<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineExpose } from 'vue'
import { fetchData } from './app'

type DataItem = {
  timestamp: string
  temperature: number
  humidity: number
  ip_address: string
}

const fetchedData = ref<DataItem[]>([])
const error = ref<string | null>(null)
let intervalId: NodeJS.Timeout | null = null

onMounted(async () => {
  try {
    const data = await fetchData()
    if (JSON.stringify(data) !== JSON.stringify(fetchedData.value)) {
      fetchedData.value = data
    }
  } catch (err) {
    error.value = (err as Error).message
  }

  intervalId = setInterval(async () => {
    try {
      const data = await fetchData()
      if (JSON.stringify(data) !== JSON.stringify(fetchedData.value)) {
        fetchedData.value = data
      }
    } catch (err) {
      error.value = (err as Error).message
    }
  }, 5000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})

defineExpose({ fetchedData, error })
</script>

<template>
  <div v-if="error">
    <p>Error: {{ error }}</p>
  </div>
  <div v-else-if="fetchedData && fetchedData.length">
    <div>
      <p>Time: {{ fetchedData[fetchedData.length - 1].timestamp }}</p>
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
