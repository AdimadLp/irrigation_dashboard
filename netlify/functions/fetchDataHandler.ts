import type { Handler } from '@netlify/functions'
import { fetchData, fetchMostRecentItem, fetchSensorDataForPastWeek } from './dbFetch'

export const handler: Handler = async (event, context) => {
  let THSensorData, DeviceIPAddresses, SensorDataPastWeek

  if (event.queryStringParameters?.type === 'past') {
    try {
      SensorDataPastWeek = await fetchSensorDataForPastWeek(
        'SensorData',
        'TemperatureHumiditySensor'
      )
    } catch (error) {
      console.error(error)
      return {
        statusCode: 500,
        body: 'Error connecting to MongoDB for SensorDataPastWeek'
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        db3: SensorDataPastWeek
      })
    }
  } else if (event.queryStringParameters?.type === 'new') {
    try {
      THSensorData = await fetchMostRecentItem('SensorData', 'TemperatureHumiditySensor')
      DeviceIPAddresses = await fetchData('DeviceList', 'DeviceIPAddresses')
    } catch (error) {
      console.error(error)
      return {
        statusCode: 500,
        body: 'Error connecting to MongoDB for THSensorData or DeviceIPAddresses'
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        db1: THSensorData,
        db2: DeviceIPAddresses
      })
    }
  } else {
    return {
      statusCode: 400,
      body: 'Invalid type parameter. Please specify either "past" or "new".'
    }
  }
}
