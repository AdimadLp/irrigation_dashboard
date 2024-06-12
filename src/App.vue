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
let isUnmounted = ref<boolean>(false)
let previousTimestamp = ref<string | null>(null)
let color = ref<string>('green')
let unchangedDataCount = ref<number>(0)

onMounted(async () => {
  try {
    const data = await fetchData()
    if (!isUnmounted.value && JSON.stringify(data) !== JSON.stringify(fetchedData.value)) {
      fetchedData.value = [data]
      previousTimestamp.value = data.db1.timestamp
    }
  } catch (err) {
    error.value = (err as Error).message
  }

  intervalId = setInterval(async () => {
    try {
      const newData = await fetchData()
      if (
        !isUnmounted.value &&
        JSON.stringify(fetchedData.value[0].db1) !== JSON.stringify(newData.db1)
      ) {
        fetchedData.value = [newData]
        color.value = 'green'
        previousTimestamp.value = newData.db1.timestamp
        unchangedDataCount.value = 0
      } else {
        unchangedDataCount.value++
        if (unchangedDataCount.value >= 3) {
          color.value = 'red'
        }
      }
    } catch (err) {
      error.value = (err as Error).message
    }
  }, 5000)
})

onUnmounted(() => {
  isUnmounted.value = true
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})

defineExpose({ fetchedData, error, color })
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
        <p :class="{ working: color === 'green', 'not-working': color === 'red' }">
          Device ID: {{ item.deviceid }}
        </p>
        <p>IP Address: {{ item.ip_address }}</p>
      </div>
    </div>
  </div>
  <div v-else>
    <p>Loading...</p>
  </div>
</template>

<style scoped>
.working::before {
  content: '✔ ';
  color: green;
}

.not-working::before {
  content: '✖ ';
  color: red;
}
</style>
