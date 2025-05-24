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
            v-tooltip="getTooltipContent(schedule, day)"
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

        const updatedSchedulesMap = new Map(
          updatedSchedules.map((schedule: { scheduleID: any }) => [schedule.scheduleID, schedule])
        )

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
        .sort((a, b) => a.scheduleID - b.scheduleID)
    }

    const resetTime = (date: Date) => {
      date.setHours(0, 0, 0, 0)
      return date
    }

    const getWateringTimestamp = (schedule: any, date: Date) => {
      const plant = plants.value.find((plant) => plant.plantID === schedule.plantID)
      if (!plant || !plant.wateringHistory) return null

      const scheduleDate = resetTime(new Date(date))

      const wateringEntry = plant.wateringHistory.find((historyEntry: { timestamp: number }) => {
        const historyDate = resetTime(new Date(historyEntry.timestamp * 1000))
        return historyDate.getTime() === scheduleDate.getTime()
      })

      return wateringEntry ? wateringEntry.timestamp : null
    }

    const isInWateringHistory = (schedule: any, date: Date) => {
      return getWateringTimestamp(schedule, date) !== null
    }

    const getScheduleStyle = (schedule: any, day: number) => {
      const startTime = new Date(schedule.startTime)
      const hours = startTime.getUTCHours()
      const minutes = startTime.getUTCMinutes()
      const top = (hours * 60 + minutes) * (400 / 1440)

      const duration = schedule.duration || 60
      const height = (duration / 60) * (400 / 24)

      const schedulesForDay = getSchedulesForDay(addDays(startDate.value, day - 1))
      const schedulesAtSameTime = schedulesForDay.filter((s) => s.startTime === schedule.startTime)
      const index = schedulesAtSameTime.findIndex((s) => s.scheduleID === schedule.scheduleID)
      const verticalOffset = index * 20

      const scheduleDate = addDays(startDate.value, day - 1)
      const backgroundColor = isInWateringHistory(schedule, scheduleDate) ? '#4caf50' : '#808080'

      return {
        top: `${top + verticalOffset}px`,
        height: `${height}px`,
        left: '0',
        right: '0',
        backgroundColor
      }
    }

    const getTooltipContent = (schedule: any, day: number) => {
      const scheduleDate = addDays(startDate.value, day - 1)
      const wateringTimestamp = getWateringTimestamp(schedule, scheduleDate)
      let content = `Plant ID: ${schedule.plantID}`
      if (wateringTimestamp) {
        const wateringDate = new Date(wateringTimestamp * 1000)
        content += `<br>Watered at: ${wateringDate.toLocaleString()}`
      }
      return { content, html: true }
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
      getTooltipContent,
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
  background-color: #222222;
  color: #ffffff;
  border: 1px solid #313131;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 4px;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.week-button:hover {
  background-color: #313131;
  color: #ffffff;
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
  background-color: #808080;
  color: white;
  padding: 2px 4px;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
