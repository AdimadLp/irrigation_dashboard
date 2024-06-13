<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchData } from '../services/app'
import TemperatureHumidityChart from '../components/TemperatureHumidityChart.vue'
import { computed } from 'vue'

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

const newData = ref<DataItem | null>(null)
const pastData = ref<DataItem['db1'][]>([])
const error = ref<string | null>(null)
const transformedPastData = computed(() => pastData.value.map((item) => item))

let intervalId: number | null = null
let isUnmounted = ref<boolean>(false)
let previousTimestamp = ref<string | null>(null)
let color = ref<string>('green')
let unchangedDataCount = ref<number>(0)
const loading = ref<boolean>(true)

onMounted(async () => {
  try {
    const fetchedData = await fetchData('new')
    newData.value = fetchedData
    if (fetchedData.db1) {
      pastData.value.push(fetchedData.db1)
    }

    const fetchedPastData = await fetchData('past')
    if (Array.isArray(fetchedPastData.db3)) {
      pastData.value = fetchedPastData.db3
    }
    loading.value = false
  } catch (err) {
    error.value = (err as Error).message
    loading.value = false
  }

  intervalId = setInterval(async () => {
    try {
      const fetchedData = await fetchData('new')
      if (
        !isUnmounted.value &&
        JSON.stringify(newData.value?.db1) !== JSON.stringify(fetchedData.db1)
      ) {
        newData.value = fetchedData
        pastData.value.push(fetchedData.db1)
        console.log(pastData.value)
        color.value = 'green'
        previousTimestamp.value = fetchedData.db1.timestamp
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

defineExpose({ newData, pastData, error, color, loading })
</script>

<template>
  <div v-if="error">
    <p>Error: {{ error }}</p>
  </div>
  <div v-else-if="newData">
    <div>
      <p>Temperature: {{ newData.db1.temperature }}</p>
      <p>Humidity: {{ newData.db1.humidity }}</p>
      <p>Timestamp: {{ newData.db1.timestamp }}</p>
      <div v-for="(item, index) in newData.db2" :key="index">
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
  <TemperatureHumidityChart
    v-if="pastData && pastData.length > 0"
    :past-data="transformedPastData"
  />
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
