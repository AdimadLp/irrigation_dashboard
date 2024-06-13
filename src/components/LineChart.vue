<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import type { ChartDataset, Point } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale)

export default defineComponent({
  props: {
    datasets: {
      type: Array as () => ChartDataset<'line', (number | Point | null)[]>[],
      required: true
    },
    title: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const chart = ref<Chart<'line', (number | Point | null)[], unknown> | null>(null)
    const canvasRef = ref<HTMLCanvasElement | null>(null)

    onMounted(() => {
      if (canvasRef.value) {
        const ctx = canvasRef.value.getContext('2d')
        if (ctx) {
          chart.value = new Chart<'line', (number | Point | null)[], unknown>(ctx, {
            type: 'line',
            data: {
              datasets: props.datasets
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: props.title
                }
              },
              scales: {
                x: {
                  type: 'time',
                  time: {
                    unit: 'day'
                  }
                },
                y: {
                  type: 'linear'
                }
              }
            }
          })
        }
      }
    })

    return { chart, canvasRef }
  }
})
</script>

<template>
  <div>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
