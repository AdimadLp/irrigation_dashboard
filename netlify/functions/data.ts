import type { Handler } from '@netlify/functions'
import { fetchData } from './fetchData'

export const handler: Handler = async (event, context) => {
  try {
    const itemsFromDb1 = await fetchData('SensorData', 'TemperatureHumiditySensor')
    const itemsFromDb2 = await fetchData('DeviceList', 'DeviceIPAddresses')
    // Fetch from more databases and collections as needed...

    return {
      statusCode: 200,
      body: JSON.stringify({
        db1: itemsFromDb1,
        db2: itemsFromDb2
        // Include more data as needed...
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
