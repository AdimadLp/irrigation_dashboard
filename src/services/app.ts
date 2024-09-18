export async function fetchDashboardInit() {
  const response = await fetch(`/.netlify/functions/fetchDashboardInit`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
export async function fetchSensorChartUpdate(
  type: 'pastDay' | 'pastWeek' | 'pastMonth' | 'pastYear' | 'all' | 'watchChanges',
  sensorIds: number[],
  lastTimestamps: number[]
) {
  const response = await fetch(
    `/.netlify/functions/fetchSensorChartUpdate?type=${type}&sensorIds=${sensorIds.join(',')}&lastTimestamps=${lastTimestamps.join(',')}`
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  console.log(response)
  return await response.json()
}
export async function fetchIrrigationTimelineUpdate(scheduleID: string) {
  const response = await fetch(
    `/.netlify/functions/fetchIrrigationTimelineUpdate?scheduleID=${scheduleID}`
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
export async function fetchPastSensorData(
  type: 'pastDay' | 'pastWeek' | 'pastMonth' | 'pastYear' | 'all',
  sensorId: string
) {
  const response = await fetch(
    `/.netlify/functions/fetchSensorChartUpdate?type=${type}&sensorId=${sensorId}`
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  console.log(response)
  return await response.json()
}
export async function fetchConfigInit() {
  const response = await fetch(`/.netlify/functions/fetchConfigInit`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
