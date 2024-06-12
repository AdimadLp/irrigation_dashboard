import { connectToDb } from './dbConnect'

export async function fetchData(databaseName: string, collectionName: string) {
  const client = await connectToDb()
  const database = client.db(databaseName)
  const collection = database.collection(collectionName)

  const items = await collection.find().toArray()

  await client.close()

  return items
}
