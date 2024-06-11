import { MongoClient, ServerApiVersion } from 'mongodb'
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  const uri = process.env.VITE_MONGODB_ATLAS_CONNECTION_STRING

  if (!uri) {
    return {
      statusCode: 500,
      body: 'MONGODB_ATLAS_CONNECTION_STRING environment variable not set'
    }
  }

  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })

    await client.connect()

    const sensorDataDatabase = client.db('SensorData')
    const temperatureHumiditySensorCollection = sensorDataDatabase.collection(
      'TemperatureHumiditySensor'
    )

    const deviceListDatabase = client.db('DeviceList')
    const deviceListCollection = deviceListDatabase.collection('DeviceIPAddresses')

    const sensorItems = await temperatureHumiditySensorCollection.find().toArray()
    const deviceListItems = await deviceListCollection.find().toArray()

    await client.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        sensorItems,
        deviceListItems
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
