import { CosmosClient } from '@azure/cosmos'
import { config } from 'dotenv'
config()
const databaseId = 'PublicMonitorData'
const containerId = 'PublicMonitorDataContainer'

// Get the connection string from environment variables
const connectionString = process.env.COSMOS_DB_CONNECTION_STRING

if (!connectionString) {
  throw new Error('COSMOS_DB_CONNECTION_STRING environment variable not set')
}

export async function readData() {
  const client = new CosmosClient(connectionString as string)

  const database = client.database(databaseId)
  const container = database.container(containerId)
  const { resources: items } = await container.items.query('SELECT * FROM c').fetchAll()

  return items
}
