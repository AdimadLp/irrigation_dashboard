const { MongoClient, ServerApiVersion } = require('mongodb')

exports.handler = async (event, context) => {
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

    const database = client.db('SensorData')
    const collection = database.collection('TemperatureHumiditySensor')

    const items = await collection.find().toArray()

    await client.close()

    return {
      statusCode: 200,
      body: JSON.stringify(items)
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: 'Error connecting to MongoDB'
    }
  }
}
