import { connectToDb } from './dbConnect'

export async function fetchData(databaseName: string, collectionName: string) {
  const client = await connectToDb()
  const database = client.db(databaseName)
  const collection = database.collection(collectionName)

  const items = await collection.find().toArray()

  await client.close()

  return items
}

export async function fetchMostRecentItem(databaseName: string, collectionName: string) {
  const client = await connectToDb()
  const database = client.db(databaseName)
  const collection = database.collection(collectionName)

  const item = await collection.find().sort({ timestamp: -1 }).limit(1).toArray()

  await client.close()
  return item[0]
}

export async function fetchSensorDataForPastWeek(databaseName: string, collectionName: string) {
  const client = await connectToDb()
  const database = client.db(databaseName)
  const collection = database.collection(collectionName)

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const items = await collection
    .find({ timestamp: { $gte: new Date(oneWeekAgo).toISOString() } })
    .toArray()

  await client.close()
  return items
}
