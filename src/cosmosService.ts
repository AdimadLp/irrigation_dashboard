import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = import.meta.env.VITE_MONGODB_ATLAS_CONNECTION_STRING

if (!uri) {
  throw new Error('MONGODB_ATLAS_CONNECTION_STRING environment variable not set')
}

export async function readData() {
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })

    await client.connect()

    const database = client.db('SensorData')
    const collection = database.collection('TemperatureHumiditySensor')

    const items = await collection.find().toArray()

    await client.close()

    return items
  } catch (error) {
    console.error(error)
  }
}
