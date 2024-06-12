import type { Handler } from '@netlify/functions'
import { fetchData, fetchMostRecentItem } from './dbFetch'

export const handler: Handler = async (event, context) => {
  let THSensorData, DeviceIPAddresses
  try {
    THSensorData = await fetchMostRecentItem('SensorData', 'TemperatureHumiditySensor')
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: 'Error connecting to MongoDB for THSensorData'
    }
  }

  try {
    DeviceIPAddresses = await fetchData('DeviceList', 'DeviceIPAddresses')
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: 'Error connecting to MongoDB for DeviceIPAddresses'
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      db1: THSensorData,
      db2: DeviceIPAddresses
    })
  }
}
