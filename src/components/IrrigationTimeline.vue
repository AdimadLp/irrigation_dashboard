<template>
  <div class="irrigation-timeline">
    <div class="timeline-header">
      <button @click="previousWeek">&lt;</button>
      <h2>{{ formatDateRange(startDate, endDate) }}</h2>
      <button @click="nextWeek">&gt;</button>
    </div>
    <div class="timeline-grid">
      <div v-for="day in 7" :key="day" class="day-column">
        <div class="day-header">{{ formatDay(addDays(startDate, day - 1)) }}</div>
        <div class="schedule-container">
          <div
            v-for="schedule in getSchedulesForDay(addDays(startDate, day - 1))"
            :key="`${schedule.scheduleID}-${day}`"
            class="schedule-item"
            :style="getScheduleStyle(schedule)"
          >
            {{ schedule.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { fetchIrrigationTimelineUpdate } from '@/services/app'

export default defineComponent({
  name: 'IrrigationTimeline',
  props: {
    scheduleArray: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const schedules = ref<any[]>([])
    const startDate = ref(new Date())
    const endDate = computed(() => addDays(startDate.value, 6))
    let updateInterval: number | null = null

    const fetchSchedules = async () => {
      try {
        const scheduleIds = schedules.value.map((schedule) => schedule.scheduleID)
        const lastTimestamps = schedules.value.map((schedule) => schedule.timestamp)
        const updatedSchedules = await fetchIrrigationTimelineUpdate(scheduleIds, lastTimestamps)
        schedules.value = updatedSchedules
        console.log('Fetched schedules:', updatedSchedules)
      } catch (error) {
        console.error('Error fetching schedules:', error)
      }
    }

    const initializeSchedules = () => {
      schedules.value = JSON.parse(JSON.stringify(props.scheduleArray))
      console.log('Initialized schedules:', schedules.value)
    }

    const previousWeek = () => {
      startDate.value = addDays(startDate.value, -7)
    }

    const nextWeek = () => {
      startDate.value = addDays(startDate.value, 7)
    }

    const formatDateRange = (start: Date, end: Date) => {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    }

    const formatDay = (date: Date) => {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const addDays = (date: Date, days: number) => {
      const result = new Date(date)
      result.setDate(result.getDate() + days)
      return result
    }

    const getSchedulesForDay = (date: Date) => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
      return schedules.value.filter((schedule) => schedule.weekdays.includes(dayName))
    }

    const getScheduleStyle = (schedule: any) => {
      const startTime = new Date(schedule.startTime)
      const hours = startTime.getUTCHours()
      const minutes = startTime.getUTCMinutes()
      const top = (hours * 60 + minutes) * (400 / 1440) // 400px height for 24 hours

      // Assuming a default duration of 1 hour if not provided
      const duration = schedule.duration || 60
      const height = (duration / 60) * (400 / 24)

      return {
        top: `${top}px`,
        height: `${height}px`
      }
    }

    onMounted(() => {
      initializeSchedules()
      updateInterval = window.setInterval(fetchSchedules, 5000)
    })

    onUnmounted(() => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    })

    watch(() => props.scheduleArray, initializeSchedules, { deep: true })

    return {
      schedules,
      startDate,
      endDate,
      previousWeek,
      nextWeek,
      formatDateRange,
      formatDay,
      addDays,
      getSchedulesForDay,
      getScheduleStyle
    }
  }
})
</script>

<style scoped>
.irrigation-timeline {
  width: 100%;
  overflow-x: auto;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.timeline-grid {
  display: flex;
  min-width: 800px;
}

.day-column {
  flex: 1;
  border-right: 1px solid #ccc;
  height: 400px;
  position: relative;
}

.day-header {
  text-align: center;
  padding: 0.5rem;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
}

.schedule-container {
  position: relative;
  height: 100%;
}

.schedule-item {
  position: absolute;
  left: 0;
  right: 0;
  background-color: #4caf50;
  color: white;
  padding: 2px 4px;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
