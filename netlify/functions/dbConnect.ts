import { MongoClient, ServerApiVersion } from 'mongodb'

export async function connectToDb() {
  const uri = process.env.VITE_MONGODB_ATLAS_CONNECTION_STRING

  if (!uri) {
    throw new Error('MONGODB_ATLAS_CONNECTION_STRING environment variable not set')
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  })

  await client.connect()
  return client
}
