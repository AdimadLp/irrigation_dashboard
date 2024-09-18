import type { Handler, HandlerEvent } from '@netlify/functions'
import { connectToDb } from './dbConnect'

const DATABASE_NAME = 'irrigation_system'
const COLLECTION_NAME = 'sensors'

export async function getReadingsAfterTimestamp(sensorId: string, lastTimestamp: number) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const sensor = await collection
      .aggregate([
        { $match: { sensorID: parseInt(sensorId) } },
        {
          $project: {
            readings: {
              $filter: {
                input: '$readings',
                as: 'reading',
                cond: { $gt: ['$$reading.timestamp', lastTimestamp] }
              }
            }
          }
        }
      ])
      .toArray()

    if (sensor.length > 0 && sensor[0].readings) {
      return sensor[0].readings
    } else {
      return []
    }
  } finally {
    await client.close()
  }
}

async function fetchMostRecentItem(sensorId: string) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const sensor = await collection.findOne(
      { sensorID: parseInt(sensorId) },
      { projection: { readings: { $slice: -1 } } }
    )

    return sensor?.readings[0] || null
  } finally {
    await client.close()
  }
}

async function fetchSensorDataForPastDay(sensorId: string) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400 // Unix timestamp for 24 hours ago

    const sensor = await collection.findOne(
      { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneDayAgo } },
      { projection: { _id: 0 } }
    )

    return sensor
  } finally {
    await client.close()
  }
}

async function fetchSensorDataForPastWeek(sensorId: string) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const oneWeekAgo = Math.floor(Date.now() / 1000) - 604800 // Unix timestamp for 7 days ago

    const sensor = await collection.findOne(
      { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneWeekAgo } },
      { sort: { 'readings.timestamp': -1 } }
    )

    return sensor?.readings || []
  } finally {
    await client.close()
  }
}

async function fetchSensorDataForPastMonth(sensorId: string) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const oneMonthAgo = Math.floor(Date.now() / 1000) - 2592000 // Unix timestamp for 30 days ago

    const sensor = await collection.findOne(
      { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneMonthAgo } },
      { sort: { 'readings.timestamp': -1 } }
    )

    return sensor?.readings || []
  } finally {
    await client.close()
  }
}

async function fetchSensorDataForPastYear(sensorId: string) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const oneYearAgo = Math.floor(Date.now() / 1000) - 31536000 // Unix timestamp for 365 days ago

    const sensor = await collection.findOne(
      { sensorID: parseInt(sensorId), 'readings.timestamp': { $gte: oneYearAgo } },
      { sort: { 'readings.timestamp': -1 } }
    )

    return sensor?.readings || []
  } finally {
    await client.close()
  }
}

async function fetchAllSensorData(sensorId: string) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const sensor = await collection.findOne(
      { sensorID: parseInt(sensorId) },
      { sort: { 'readings.timestamp': -1 } }
    )

    return sensor?.readings || []
  } finally {
    await client.close()
  }
}

async function fetchSensorData(type: string, sensorId: string, lastTimestamp?: number) {
  switch (type) {
    case 'pastDay':
      return await fetchSensorDataForPastDay(sensorId)
    case 'pastWeek':
      return await fetchSensorDataForPastWeek(sensorId)
    case 'pastMonth':
      return await fetchSensorDataForPastMonth(sensorId)
    case 'pastYear':
      return await fetchSensorDataForPastYear(sensorId)
    case 'all':
      return await fetchAllSensorData(sensorId)
    case 'mostRecent':
      return await fetchMostRecentItem(sensorId)
    case 'watchChanges':
      return await getReadingsAfterTimestamp(sensorId, lastTimestamp || 0)
    default:
      throw new Error('Invalid type parameter.')
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const sensorData: { sensorID: string; readings: any }[] = []

  const type = event.queryStringParameters?.type
  const sensorIds = event.queryStringParameters?.sensorIds?.split(',')
  const lastTimestamps = event.queryStringParameters?.lastTimestamps?.split(',').map(Number)

  if (!type || !sensorIds || !lastTimestamps || sensorIds.length !== lastTimestamps.length) {
    return {
      statusCode: 400,
      body: 'Missing or mismatched type, sensorIds, or lastTimestamps parameters.'
    }
  }

  try {
    for (let i = 0; i < sensorIds.length; i++) {
      const data = await fetchSensorData(type, sensorIds[i], lastTimestamps[i])
      sensorData.push({ sensorID: sensorIds[i], readings: data })
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: `Error connecting to MongoDB for ${type}`
    }
  }

  console.log(sensorData)
  return {
    statusCode: 200,
    body: JSON.stringify({
      sensorData
    })
  }
}
