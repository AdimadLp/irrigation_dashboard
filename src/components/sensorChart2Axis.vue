<template>
  <div class="chart-wrapper">
    <canvas :ref="chartId" :id="chartId"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
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
} from 'chart.js/auto'

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

interface SensorDataPoint {
  timestamp: string
  [key: string]: number | string
}

interface SensorConfig {
  key: string
  label: string
  color: string
}

const props = defineProps({
  sensorData: {
    type: Array as () => SensorDataPoint[],
    required: true
  },
  sensors: {
    type: Array as () => SensorConfig[],
    required: true
  },
  title: {
    type: String,
    default: 'Sensor Data over Time'
  },
  chartId: {
    type: String,
    required: true
  }
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null
let lastChangeTimestamp = ref<Date | null>(null)

const averageDataPoints = (data: SensorDataPoint[], maxPoints: number): SensorDataPoint[] => {
  if (data.length <= maxPoints) return data

  const averagedData: SensorDataPoint[] = []
  const chunkSize = Math.ceil(data.length / maxPoints)

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    const avgTimestamp = chunk[Math.floor(chunk.length / 2)].timestamp
    const avgDataPoint: SensorDataPoint = { timestamp: avgTimestamp }

    props.sensors.forEach((sensor) => {
      const avgValue =
        chunk.reduce((sum, point) => sum + (point[sensor.key] as number), 0) / chunk.length
      avgDataPoint[sensor.key] = avgValue
    })

    averagedData.push(avgDataPoint)
  }

  return averagedData
}

const createChart = () => {
  const canvas = document.getElementById(props.chartId) as HTMLCanvasElement
  if (!canvas) return

  // Destroy the existing chart instance if it exists
  if (chart) {
    chart.destroy()
    chart = null // Ensure chart is set to null after destruction
  }

  // Clear the canvas
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const averagedData = averageDataPoints(props.sensorData, 100)

  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: averagedData.map((item) => item.timestamp),
      datasets: props.sensors.map((sensor) => ({
        label: sensor.label,
        data: averagedData.map((item) => item[sensor.key] as number),
        borderColor: sensor.color,
        backgroundColor: sensor.color,
        fill: false,
        tension: 0.1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: props.title
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            displayFormats: {
              minute: 'MMM D, HH:mm'
            }
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value'
          }
        }
      }
    }
  })
}

const updateChart = (newData: SensorDataPoint[]) => {
  if (!chart) return

  const averagedData = averageDataPoints(newData, 100)
  let isDataChanged = false

  averagedData.forEach((data, index) => {
    const dataTimestamp = new Date(data.timestamp)
    if (!lastChangeTimestamp.value || dataTimestamp > lastChangeTimestamp.value) {
      if (index < chart.data.labels!.length) {
        if (chart.data.labels![index] !== data.timestamp) {
          isDataChanged = true
          chart.data.labels![index] = data.timestamp
        }

        props.sensors.forEach((sensor, sensorIndex) => {
          if (sensorIndex < chart.data.datasets.length) {
            const newValue = data[sensor.key] as number
            if (chart.data.datasets[sensorIndex].data[index] !== newValue) {
              isDataChanged = true
              chart.data.datasets[sensorIndex].data[index] = newValue
            }
          }
        })

        if (
          isDataChanged &&
          (!lastChangeTimestamp.value || dataTimestamp > lastChangeTimestamp.value)
        ) {
          lastChangeTimestamp.value = dataTimestamp
        }
      }
    }
  })

  if (isDataChanged) {
    chart.update()
  }
}

const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

onMounted(() => {
  chartCanvas.value = document.getElementById(props.chartId) as HTMLCanvasElement
  if (chartCanvas.value) {
    createChart()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.destroy()
    chart = null // Ensure chart is set to null after destruction
  }
})

watch(
  () => props.sensorData,
  (newData) => {
    if (chart) {
      updateChart(newData)
    } else {
      createChart()
    }
  }
)

watch(
  () => props.title,
  (newTitle) => {
    if (chart && chart.options.plugins?.title) {
      chart.options.plugins.title.text = newTitle
      chart.update()
    }
  }
)
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
