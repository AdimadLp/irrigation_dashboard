<template>
  <div class="chart-wrapper">
    <canvas :ref="chartId" :id="chartId"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
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
  color?: string
  yAxisID: string
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
    default: 'SensorChart3Axis'
  },
  chartId: {
    type: String,
    required: true
  }
})

const defaultColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

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

const getDateRange = computed(() => {
  if (props.sensorData.length === 0) return ''
  const startDate = new Date(props.sensorData[0].timestamp)
  const endDate = new Date(props.sensorData[props.sensorData.length - 1].timestamp)
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
})

const createChart = () => {
  const canvas = document.getElementById(props.chartId) as HTMLCanvasElement
  if (!canvas) return

  if (chart) {
    chart.destroy()
    chart = null
  }

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const averagedData = averageDataPoints(props.sensorData, 100)

  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: averagedData.map((item) => item.timestamp),
      datasets: props.sensors.map((sensor, index) => {
        const color = sensor.color || defaultColors[index % defaultColors.length]
        return {
          label: sensor.label,
          data: averagedData.map((item) => item[sensor.key] as number),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: color,
          fill: false,
          tension: 0.1,
          yAxisID: index === 0 ? 'y-axis-1' : 'y-axis-2'
        }
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: [`${props.title}`, `Date Range: ${getDateRange.value}`]
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
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
          display: false,
          time: {
            unit: 'minute',
            displayFormats: {
              minute: 'HH:mm'
            }
          },
          title: {
            text: 'Time'
          }
        },
        'y-axis-1': {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: props.sensors[0].label
          },
          ticks: {
            color: props.sensors[0].color || defaultColors[0]
          }
        },
        'y-axis-2': {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: props.sensors[1].label
          },
          ticks: {
            color: props.sensors[1].color || defaultColors[1]
          },
          grid: {
            drawOnChartArea: false
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
    chart.options.plugins!.title!.text = [`${props.title}`, `Date Range: ${getDateRange.value}`]
    chart.update()
  }
}

watch(
  () => props.sensorData,
  (newData) => {
    if (chart) {
      updateChart(newData)
    } else {
      createChart()
    }
  },
  { deep: true }
)

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
})
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
