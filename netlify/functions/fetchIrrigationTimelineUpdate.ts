import type { Handler, HandlerEvent } from '@netlify/functions'
import { connectToDb } from './dbConnect'

const DATABASE_NAME = 'irrigation_system'
const COLLECTION_NAME = 'schedules'

export async function getUpdatedSchedules(scheduleIds: number[], lastTimestamps: number[]) {
  const client = await connectToDb()
  try {
    const database = client.db(DATABASE_NAME)
    const collection = database.collection(COLLECTION_NAME)

    const schedules = await collection
      .find({
        scheduleID: { $in: scheduleIds.map(Number) },
        lastModified: { $gt: Math.max(...lastTimestamps) }
      })
      .toArray()

    return schedules
  } finally {
    await client.close()
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const scheduleIds = event.queryStringParameters?.scheduleIds?.split(',').map(Number)
  const lastTimestamps = event.queryStringParameters?.lastTimestamps?.split(',').map(Number)

  if (!scheduleIds || !lastTimestamps || scheduleIds.length !== lastTimestamps.length) {
    return {
      statusCode: 400,
      body: 'Missing or mismatched sensorIds or lastTimestamps parameters.'
    }
  }
  try {
    const updatedSchedules = await getUpdatedSchedules(scheduleIds, lastTimestamps)
    return {
      statusCode: 200,
      body: JSON.stringify(updatedSchedules)
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: `Error connecting to MongoDB for updated schedules`
    }
  }
}
