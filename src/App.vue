<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineExpose } from 'vue'
import { fetchData } from './app'

type DataItem = {
  db1: {
    _id: string
    temperature: number
    humidity: number
    timestamp: string
  }
  db2: Array<{
    _id: string
    deviceid: string
    ip_address: string
    timestamp: string
  }>
}

const fetchedData = ref<DataItem[]>([])
const error = ref<string | null>(null)
let intervalId: number | null = null

onMounted(async () => {
  try {
    const data = await fetchData()
    if (JSON.stringify(data) !== JSON.stringify(fetchedData.value)) {
      fetchedData.value = [data] // Da die Daten jetzt ein einzelnes Objekt sind, wickeln wir sie in ein Array ein
    }
  } catch (err) {
    error.value = (err as Error).message
  }

  intervalId = setInterval(async () => {
    try {
      const newData = await fetchData()
      if (JSON.stringify(fetchedData.value[0]) !== JSON.stringify(newData)) {
        fetchedData.value = [newData]
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
      <p>Temperature: {{ fetchedData[0].db1.temperature }}</p>
      <p>Humidity: {{ fetchedData[0].db1.humidity }}</p>
      <p>Timestamp: {{ fetchedData[0].db1.timestamp }}</p>
      <div v-for="(item, index) in fetchedData[0].db2" :key="index">
        <p>Device ID: {{ item.deviceid }}</p>
        <p>IP Address: {{ item.ip_address }}</p>
      </div>
    </div>
  </div>
  <div v-else>
    <p>Loading...</p>
  </div>
</template>

<style scoped>
/* Your styles here */
</style>
