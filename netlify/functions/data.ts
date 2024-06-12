import type { Handler } from '@netlify/functions'
import { fetchData, fetchMostRecentItem } from './fetchData'

export const handler: Handler = async (event, context) => {
  try {
    const THSensorData = await fetchMostRecentItem('SensorData', 'TemperatureHumiditySensor')
    const DeviceIPAddresses = await fetchData('DeviceList', 'DeviceIPAddresses')

    return {
      statusCode: 200,
      body: JSON.stringify({
        db1: THSensorData,
        db2: DeviceIPAddresses
      })
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: 'Error connecting to MongoDB'
    }
  }
}
