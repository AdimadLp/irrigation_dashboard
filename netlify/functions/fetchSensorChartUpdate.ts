import type { Handler } from '@netlify/functions'
import { connectToDb } from './dbConnect'

const DATABASE_NAME = 'irrigation_system'
const COLLECTION_NAME = 'sensors'

async function fetchMostRecentItem(sensorId: string) {
  const client = await connectToDb()
  const database = client.db(DATABASE_NAME)
  const collection = database.collection(COLLECTION_NAME)

  const sensor = await collection.findOne(
    { sensorID: parseInt(sensorId) },
    { projection: { readings: { $slice: -1 } } }
  )

  await client.close()

  return sensor?.readings[0] || null
}

async function fetchSensorDataForPastDay(sensorId: string) {
  const client = await connectToDb()
  const database = client.db(DATABASE_NAME)
  const collection = database.collection(COLLECTION_NAME)

  const oneDayAgo = Math.floor(Date.now() / 1000) - 86400 // Unix timestamp for 24 hours ago

  const sensor = await collection.findOne(
    { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneDayAgo } },
    { projection: { _id: 0 } }
  )

  return sensor
}

async function fetchSensorDataForPastWeek(sensorId: string) {
  const client = await connectToDb()
  const database = client.db(DATABASE_NAME)
  const collection = database.collection(COLLECTION_NAME)

  const oneWeekAgo = Math.floor(Date.now() / 1000) - 604800 // Unix timestamp for 7 days ago

  const sensor = await collection.findOne(
    { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneWeekAgo } },
    { sort: { 'readings.timestamp': -1 } }
  )

  await client.close()
  return sensor?.readings || []
}

async function fetchSensorDataForPastMonth(sensorId: string) {
  const client = await connectToDb()
  const database = client.db(DATABASE_NAME)
  const collection = database.collection(COLLECTION_NAME)

  const oneMonthAgo = Math.floor(Date.now() / 1000) - 2592000 // Unix timestamp for 30 days ago

  const sensor = await collection.findOne(
    { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneMonthAgo } },
    { sort: { 'readings.timestamp': -1 } }
  )

  await client.close()
  return sensor?.readings || []
}

async function fetchSensorDataForPastYear(sensorId: string) {
  const client = await connectToDb()
  const database = client.db(DATABASE_NAME)
  const collection = database.collection(COLLECTION_NAME)

  const oneYearAgo = Math.floor(Date.now() / 1000) - 31536000 // Unix timestamp for 365 days ago

  const sensor = await collection.findOne(
    { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneYearAgo } },
    { sort: { 'readings.timestamp': -1 } }
  )

  await client.close()
  return sensor?.readings || []
}

async function fetchAllSensorData(sensorId: string) {
  const client = await connectToDb()
  const database = client.db(DATABASE_NAME)
  const collection = database.collection(COLLECTION_NAME)

  const sensor = await collection.findOne(
    { sensorID: parseInt(sensorId) },
    { sort: { 'readings.timestamp': -1 } }
  )

  await client.close()
  return sensor?.readings || []
}

export const handler: Handler = async (event, context) => {
  let sensorData

  const type = event.queryStringParameters?.type
  const sensorId = event.queryStringParameters?.sensorId

  if (!sensorId) {
    return {
      statusCode: 400,
      body: 'Missing sensorID parameter.'
    }
  }

  try {
    switch (type) {
      case 'pastDay':
        sensorData = await fetchSensorDataForPastDay(sensorId)
        break
      case 'pastWeek':
        sensorData = await fetchSensorDataForPastWeek(sensorId)
        break
      case 'pastMonth':
        sensorData = await fetchSensorDataForPastMonth(sensorId)
        break
      case 'pastYear':
        sensorData = await fetchSensorDataForPastYear(sensorId)
        break
      case 'all':
        sensorData = await fetchAllSensorData(sensorId)
        break
      case 'mostRecent':
        sensorData = await fetchMostRecentItem(sensorId)
        break
      default:
        return {
          statusCode: 400,
          body: 'Invalid type parameter. Please specify either "pastDay", "pastWeek", "pastMonth", "pastYear", "all", or "mostRecent".'
        }
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: `Error connecting to MongoDB for ${type}`
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      sensorData
    })
  }
}