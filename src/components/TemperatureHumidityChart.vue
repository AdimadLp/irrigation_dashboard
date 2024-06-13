<template>
  <div v-if="pastData.length">
    <canvas id="temperatureHumidityChart"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, defineProps, ref } from 'vue'
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

let chart = ref<Chart<'line', any, unknown> | undefined>(undefined)
let lastChangeTimestamp = ref<Date | null>(null)

interface DataPoint {
  timestamp: string
  temperature: number
  humidity: number
}

const props = defineProps({
  pastData: {
    type: Array as () => DataPoint[],
    required: true
  } as const
})

onMounted(() => {
  const chartElement = document.getElementById('temperatureHumidityChart') as HTMLCanvasElement
  if (chartElement) {
    chart.value = new Chart(chartElement, {
      type: 'line',
      data: {
        labels: props.pastData.map((item: DataPoint) => item.timestamp),
        datasets: [
          {
            label: 'Temperature',
            data: props.pastData.map((item: DataPoint) => item.temperature),
            borderColor: 'rgb(255, 99, 132)',
            fill: false
          },
          {
            label: 'Humidity',
            data: props.pastData.map((item: DataPoint) => item.humidity),
            borderColor: 'rgb(75, 192, 192)',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Temperature and Humidity over Time'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        interaction: {
          intersect: false
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute'
            }
          },
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
})

watch(
  () => props.pastData,
  (newData: DataPoint[]) => {
    if (newData && chart.value && chart.value.data && chart.value.data.labels) {
      let isDataChanged = false
      newData.forEach((data, index) => {
        const dataTimestamp = new Date(data.timestamp)
        if (
          !lastChangeTimestamp.value || // Add null check here
          (lastChangeTimestamp.value && dataTimestamp > lastChangeTimestamp.value)
        ) {
          if (
            chart.value &&
            chart.value.data &&
            chart.value.data.labels &&
            index < chart.value.data.labels.length &&
            index < chart.value.data.datasets[0].data.length &&
            index < chart.value.data.datasets[1].data.length
          ) {
            if (
              chart.value.data.labels[index] !== data.timestamp ||
              chart.value.data.datasets[0].data[index] !== data.temperature ||
              chart.value.data.datasets[1].data[index] !== data.humidity
            ) {
              isDataChanged = true
              chart.value.data.labels[index] = data.timestamp
              chart.value.data.datasets[0].data[index] = data.temperature
              chart.value.data.datasets[1].data[index] = data.humidity
              if (lastChangeTimestamp.value && dataTimestamp > lastChangeTimestamp.value) {
                // Add null check here
                lastChangeTimestamp.value = dataTimestamp
              }
            }
          }
        } //
      })
      if (chart.value && isDataChanged) {
        chart.value.update()
      }
    }
  }
)
</script>
