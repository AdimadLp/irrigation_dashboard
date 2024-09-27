<template>
  <div class="irrigation-timeline">
    <div class="timeline-header">
      <button class="week-button" @click="previousWeek">&lt;</button>
      <h2>{{ formatDateRange(startDate, endDate) }}</h2>
      <button class="week-button" @click="nextWeek">&gt;</button>
    </div>
    <div class="timeline-grid">
      <div v-for="day in 7" :key="day" class="day-column">
        <div class="day-header">{{ formatDay(addDays(startDate, day - 1)) }}</div>
        <div class="schedule-container">
          <div
            v-for="schedule in getSchedulesForDay(addDays(startDate, day - 1))"
            :key="`${schedule.scheduleID}-${day}`"
            class="schedule-item"
            :style="getScheduleStyle(schedule, day)"
            v-tooltip="{ content: `Plant ID: ${schedule.plantID}` }"
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
    },
    plantArray: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const schedules = ref<any[]>([])
    const plants = ref<any[]>([])
    const startDate = ref(new Date())
    const endDate = computed(() => addDays(startDate.value, 6))
    let updateInterval: number | null = null

    const fetchSchedules = async () => {
      try {
        const scheduleIds = schedules.value.map((schedule) => schedule.scheduleID)
        const lastTimestamps = schedules.value.map((schedule) => schedule.timestamp)
        const updatedSchedules = await fetchIrrigationTimelineUpdate(scheduleIds, lastTimestamps)

        // Create a map of updated schedules
        const updatedSchedulesMap = new Map(
          updatedSchedules.map((schedule: { scheduleID: any }) => [schedule.scheduleID, schedule])
        )

        // Replace only the schedules that have been updated
        schedules.value = schedules.value.map((schedule) =>
          updatedSchedulesMap.has(schedule.scheduleID)
            ? updatedSchedulesMap.get(schedule.scheduleID)
            : schedule
        )

        console.log('Fetched schedules:', updatedSchedules)
      } catch (error) {
        console.error('Error fetching schedules:', error)
      }
    }

    const initializeSchedules = () => {
      schedules.value = JSON.parse(JSON.stringify(props.scheduleArray))
      console.log('Initialized schedules:', schedules.value)
    }

    const initializePlants = () => {
      plants.value = JSON.parse(JSON.stringify(props.plantArray))
      console.log('Initialized plants:', plants.value)
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
      return schedules.value
        .filter((schedule) => schedule.weekdays.includes(dayName))
        .sort((a, b) => a.scheduleID - b.scheduleID) // Sort by scheduleID
    }

    const getScheduleStyle = (schedule: any, day: number) => {
      const startTime = new Date(schedule.startTime)
      const hours = startTime.getUTCHours()
      const minutes = startTime.getUTCMinutes()
      const top = (hours * 60 + minutes) * (400 / 1440) // 400px height for 24 hours

      // Assuming a default duration of 1 hour if not provided
      const duration = schedule.duration || 60
      const height = (duration / 60) * (400 / 24)

      // Calculate the vertical position based on the index of the schedule in its group
      const schedulesForDay = getSchedulesForDay(addDays(startDate.value, day - 1))
      const schedulesAtSameTime = schedulesForDay.filter((s) => s.startTime === schedule.startTime)
      const index = schedulesAtSameTime.findIndex((s) => s.scheduleID === schedule.scheduleID)
      const verticalOffset = index * 20 // Adjust the multiplier as needed for spacing

      return {
        top: `${top + verticalOffset}px`,
        height: `${height}px`,
        left: '0',
        right: '0'
      }
    }

    const getPlantName = (plantID: number) => {
      const plant = plants.value.find((plant) => plant.plantID === plantID)
      return plant ? plant.name : 'Unknown Plant'
    }

    onMounted(() => {
      initializeSchedules()
      initializePlants()
      updateInterval = window.setInterval(fetchSchedules, 5000)
    })

    onUnmounted(() => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    })

    watch(() => props.scheduleArray, initializeSchedules, { deep: true })
    watch(() => props.plantArray, initializePlants, { deep: true })

    return {
      schedules,
      plants,
      startDate,
      endDate,
      previousWeek,
      nextWeek,
      formatDateRange,
      formatDay,
      addDays,
      getSchedulesForDay,
      getScheduleStyle,
      getPlantName
    }
  }
})
</script>

<style scoped>
.irrigation-timeline {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.week-button {
  background-color: #222222; /* Match the background color of the day-header */
  color: #ffffff; /* Match the text color of the schedule-item */
  border: 1px solid #313131; /* Match the border color of the day-column */
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 4px;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.week-button:hover {
  background-color: #313131; /* Slightly lighter shade for hover effect */
  color: #ffffff; /* Keep the text color consistent */
}

.timeline-grid {
  display: flex;
  flex: 1;
}

.day-column {
  flex: 1;
  border-right: 1px solid #313131;
  height: 100%;
  position: relative;
}

.day-header {
  text-align: center;
  padding: 0.5rem;
  background-color: #222222;
  border-bottom: 1px solid #313131;
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
