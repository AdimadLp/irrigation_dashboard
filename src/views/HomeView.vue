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
          v-if="sensorArray.length > 0"
          :sensorArray="sensorArray"
          title="Room Sensors"
          chartId="combinedChart"
        />
        <p v-else class="loading-message">Loading sensor data...</p>
      </div>
    </div>
    <div class="section irrigation-section">
      <div class="irrigation-container">
        <IrrigationTimeline
          v-if="scheduleArray.length > 0"
          :scheduleArray="scheduleArray"
          title="Irrigation Timeline"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SensorDataChart from '../components/sensorChart3Axis.vue'
import IrrigationTimeline from '../components/IrrigationTimeline.vue'
import { fetchDashboardInit } from '../services/app'

const plantArray = ref([])
const sensorArray = ref([])
const scheduleArray = ref([])
const controllerArray = ref([])
const pumpArray = ref([])

onMounted(async () => {
  try {
    const response = await fetchDashboardInit()
    plantArray.value = response.plantsArray
    sensorArray.value = response.sensorsArray
    scheduleArray.value = response.schedulesArray
    controllerArray.value = response.controllersArray
    pumpArray.value = response.pumpsArray
  } catch (error) {
    console.error('Error initializing sensors:', error)
  }
})
</script>

<style scoped>
.home {
  display: grid;
  grid-template-rows: 1fr 1fr 2fr;
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

.irrigation-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 20px;
}

.irrigation-section {
  grid-column: span 2;
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
