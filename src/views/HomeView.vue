<template>
  <div class="home">
    <div class="section text-section">
      <div class="text-container">
        <h1>Welcome to the Sensor Dashboard</h1>
        <p>This dashboard provides real-time data from various sensors.</p>
      </div>
    </div>
    <div class="section chart-section">
      <div class="chart-container">
        <SensorDataChart
          v-if="allSensorData.length > 0"
          :sensorData="allSensorData"
          :sensors="sensorConfigs"
          title="Room Sensors"
          chartId="combinedChart"
        />
        <p v-else class="loading-message">Loading sensor data...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, type Ref } from 'vue'
import SensorDataChart from '../components/sensorChart3Axis.vue'
import { fetchDashboardInit } from '../services/app'

// Define types
type SensorReading = {
  timestamp: number
  value: number
}

type SensorData = {
  sensorID: string
  sensorName: string
  controllerID: string
  gpioPort: string
  type: string
  color: string
  readings: SensorReading[]
}

type SensorDataPoint = {
  timestamp: string
  [key: string]: number | string
}

// Create a reactive object to store sensor data
const sensors = reactive<Record<string, SensorData & { ref: Ref<SensorDataPoint[]> }>>({})
const allSensorData = ref<SensorDataPoint[]>([])
const sensorConfigs = ref<{ key: string; label: string; color: string; yAxisID: string }[]>([])

onMounted(async () => {
  try {
    const fetchInitialData = async () => {
      const response = await fetchDashboardInit()
      const sensorDataList = response.sensorsArray as SensorData[]

      sensorDataList.forEach((sensorData, index) => {
        sensors[sensorData.type] = {
          ...sensorData,
          ref: ref<SensorDataPoint[]>([])
        }

        // Transform initial readings
        sensors[sensorData.type].ref.value = sensorData.readings.map((reading) => ({
          timestamp: new Date(reading.timestamp * 1000).toISOString(),
          [sensorData.type]: reading.value
        }))

        // Add sensor config
        sensorConfigs.value.push({
          key: sensorData.type,
          label: sensorData.sensorName,
          color: sensorData.color,
          yAxisID: `y${index}` // Assign y-axis ID dynamically
        })

        // Combine all sensor data
        sensors[sensorData.type].ref.value.forEach((dataPoint) => {
          const existingDataPoint = allSensorData.value.find(
            (dp) => dp.timestamp === dataPoint.timestamp
          )
          if (existingDataPoint) {
            existingDataPoint[sensorData.type] = dataPoint[sensorData.type]
          } else {
            allSensorData.value.push(dataPoint)
          }
        })
      })
    }

    await fetchInitialData()
  } catch (error) {
    console.error('Error initializing sensors:', error)
  }
})
</script>

<style scoped>
.home {
  display: grid;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 100vh;
  width: 100vw;
  padding: 20px;
  box-sizing: border-box;
}

.section {
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.chart-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 20px;
}

.loading-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2em;
  color: #666;
}

h1 {
  font-size: 1.8em;
  margin-bottom: 10px;
}

p {
  font-size: 1em;
  color: #555;
}
</style>
