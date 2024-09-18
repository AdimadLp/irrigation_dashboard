<template>
  <div class="chart-wrapper">
    <canvas :ref="chartId" :id="chartId"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { fetchSensorChartUpdate } from '@/services/app'
import 'chartjs-adapter-moment'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  TimeScale,
  TimeSeriesScale
} from 'chart.js'
import type { ChartOptions, ChartDataset } from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  TimeScale,
  TimeSeriesScale
)

interface SensorReading {
  timestamp: number
  value: number
}

interface SensorData {
  sensorID: number
  sensorName: string
  controllerID: string
  gpioPort: string
  type: string
  color: string
  readings: SensorReading[]
}

interface SensorDataPoint {
  timestamp: string
  [key: string]: number | string
}

interface SensorConfig {
  key: string
  label: string
  color?: string
  yAxisID: string
}

const props = defineProps({
  sensorArray: {
    type: Array as () => SensorData[],
    required: true
  },
  title: {
    type: String,
    default: 'SensorChart3Axis'
  },
  chartId: {
    type: String,
    required: true
  }
})

const defaultColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

let chart: Chart | null = null
let updateInterval: number | null = null

const sensors = ref<SensorConfig[]>([])
const allSensorData = ref<SensorDataPoint[]>([])
const localSensorArray = ref<SensorData[]>([])

const transformSensorData = () => {
  sensors.value = localSensorArray.value.map((sensor, index) => ({
    key: sensor.type,
    label: sensor.sensorName,
    color: sensor.color || defaultColors[index % defaultColors.length],
    yAxisID: `y${index}`
  }))

  const allReadings = new Map<string, SensorDataPoint>()

  localSensorArray.value.forEach((sensor) => {
    sensor.readings.forEach((reading) => {
      const timestamp = new Date(reading.timestamp * 1000).toISOString()
      const existingReading = allReadings.get(timestamp) || { timestamp }
      existingReading[sensor.type] = reading.value
      allReadings.set(timestamp, existingReading)
    })
  })

  allSensorData.value = Array.from(allReadings.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

const averageDataPoints = (data: SensorDataPoint[], maxPoints: number): SensorDataPoint[] => {
  if (data.length <= maxPoints) return data

  const chunkSize = Math.ceil(data.length / maxPoints)
  return Array.from({ length: maxPoints }, (_, i) => {
    const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize)
    const avgTimestamp = chunk[Math.floor(chunk.length / 2)].timestamp
    const avgDataPoint: SensorDataPoint = { timestamp: avgTimestamp }

    sensors.value.forEach((sensor) => {
      const validValues = chunk
        .map((point) => point[sensor.key] as number)
        .filter((value) => !isNaN(value))

      if (validValues.length > 0) {
        avgDataPoint[sensor.key] =
          validValues.reduce((sum, value) => sum + value, 0) / validValues.length
      }
    })

    return avgDataPoint
  })
}

const getDateRange = computed(() => {
  if (allSensorData.value.length === 0) return ''
  const startDate = new Date(allSensorData.value[0].timestamp)
  const endDate = new Date(allSensorData.value[allSensorData.value.length - 1].timestamp)
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
})

const createChartConfig = (averagedData: SensorDataPoint[]) => {
  const datasets: ChartDataset<'line', number[]>[] = sensors.value.map((sensor) => ({
    label: sensor.label,
    data: averagedData.map((item) => item[sensor.key] as number),
    borderColor: sensor.color,
    backgroundColor: sensor.color,
    borderWidth: 2,
    pointBackgroundColor: sensor.color,
    pointBorderColor: sensor.color,
    pointHoverBackgroundColor: sensor.color,
    pointHoverBorderColor: sensor.color,
    fill: false,
    tension: 0.1,
    yAxisID: sensor.yAxisID,
    spanGaps: true // Ensure lines are drawn between points even if there are gaps
  }))

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: [`${props.title}`, `Date Range: ${getDateRange.value}`]
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || ''
            const value = context.raw
            return `${label}: ${value}`
          }
        }
      },
      legend: {
        labels: {
          usePointStyle: true,
          pointStyle: 'circle' as const
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm' // Display only the time
          },
          tooltipFormat: 'YYYY-MM-DD HH:mm' // Tooltip should display date and time
        },
        title: {
          display: true,
          text: 'Time'
        },
        ticks: {
          display: false, // Remove x-axis labels
          maxTicksLimit: 3 // Limit the number of ticks displayed
        },
        grid: {
          display: false // Remove grid lines
        }
      },
      ...sensors.value.reduce(
        (acc, sensor, index) => {
          acc[sensor.yAxisID] = {
            type: 'linear',
            display: true,
            position: index % 2 === 0 ? 'left' : 'right',
            title: {
              display: true,
              text: sensor.label
            },
            ticks: {
              color: sensor.color,
              callback: function (value: number) {
                return value.toFixed(1) // Display only one decimal digit
              }
            },
            grid: {
              drawOnChartArea: index === 0
            }
          }
          return acc
        },
        {} as Record<string, any>
      )
    }
  }

  return {
    type: 'line' as const,
    data: {
      labels: averagedData.map((item) => item.timestamp),
      datasets
    },
    options
  }
}

const createOrUpdateChart = () => {
  const canvas = document.getElementById(props.chartId) as HTMLCanvasElement
  if (!canvas) return

  const averagedData = averageDataPoints(allSensorData.value, 100)
  const config = createChartConfig(averagedData)

  if (chart) {
    chart.data = config.data
    chart.options = config.options
    chart.update('none')
  } else {
    chart = new Chart(canvas, config)
  }
}

const updateChartData = async () => {
  const sensorIds = localSensorArray.value.map((sensor) => sensor.sensorID)
  const lastTimestamps = localSensorArray.value.map((sensor) => {
    const readings = sensor.readings
    return readings.length > 0 ? readings[readings.length - 1].timestamp : 0
  })

  try {
    const response = await fetchSensorChartUpdate('watchChanges', sensorIds, lastTimestamps)

    let dataUpdated = false

    if (response?.sensorData?.length) {
      response.sensorData.forEach((newSensorData: any) => {
        const sensorIndex = localSensorArray.value.findIndex(
          (sensor) => sensor.sensorID === parseInt(newSensorData.sensorID)
        )

        if (sensorIndex !== -1 && newSensorData.readings?.length) {
          const existingReadings = localSensorArray.value[sensorIndex].readings
          const newReadings = newSensorData.readings.filter(
            (reading: SensorReading) => reading.timestamp > lastTimestamps[sensorIndex]
          )
          if (newReadings.length > 0) {
            localSensorArray.value[sensorIndex].readings = [...existingReadings, ...newReadings]
            dataUpdated = true
          }
        }
      })
    }

    if (dataUpdated) {
      transformSensorData()
      createOrUpdateChart()
    }
  } catch (error) {
    console.error('Error updating chart data:', error)
  }
}

const initializeChart = () => {
  localSensorArray.value = JSON.parse(JSON.stringify(props.sensorArray))
  transformSensorData()
  createOrUpdateChart()
}

onMounted(() => {
  initializeChart()
  updateInterval = window.setInterval(updateChartData, 5000)
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

watch(() => props.sensorArray, initializeChart, { deep: true })
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
