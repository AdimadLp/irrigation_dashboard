import type { Handler } from '@netlify/functions'
import { connectToDb } from './dbConnect'

const DATABASE_NAME = 'irrigation_system'
const COLLECTION_NAME = 'schedules'

async function watchScheduleChanges(scheduleID: string, onChange: (change: any) => void) {
  const client = await connectToDb()
  const database = client.db(DATABASE_NAME)
  const collection = database.collection(COLLECTION_NAME)

  const changeStream = collection.watch([
    { $match: { 'fullDocument.scheduleID': parseInt(scheduleID) } }
  ])

  changeStream.on('change', (change) => {
    onChange(change)
  })

  return () => {
    changeStream.close()
    client.close()
  }
}

export const handler: Handler = async (event, context) => {
  const scheduleID = event.queryStringParameters?.scheduleID
  if (!scheduleID) {
    return {
      statusCode: 400,
      body: 'Missing scheduleID parameter'
    }
  }

  // Set up a promise to wait for the next change
  const changePromise = new Promise((resolve, reject) => {
    watchScheduleChanges(scheduleID, (change) => {
      resolve(change)
    }).then(stopWatching => {
      stopWatching()
    }).catch(reject)
  })

  const change = await changePromise

  return {
    statusCode: 200,
    body: JSON.stringify(change)
  }
}
