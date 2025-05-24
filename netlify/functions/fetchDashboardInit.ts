import { type Handler } from '@netlify/functions'
import { connectToDb } from './dbConnect'

const DATABASE_NAME = 'irrigation_system'

const COLLECTIONS = {
  sensors: 'sensors',
  plants: 'plants',
  schedules: 'schedules',
  irrigationControllers: 'irrigation_controllers',
  pumps: 'pumps'
}

const REQUIRED_ATTRIBUTES = {
  plants: [
    'plantID',
    'plantName',
    'plantType',
    'location',
    'controllerID',
    'sensorIDs',
    'pumpIDs',
    'waterRequirement',
    'imagePath',
    'wateringHistory'
  ],
  sensors: ['sensorID', 'sensorName', 'controllerID', 'gpioPort', 'type', 'readings'],
  schedules: [
    'scheduleID',
    'weekdays',
    'startTime',
    'type',
    'plantID',
    'controllerID',
    'threshold',
    'timestamp'
  ],
  controllers: ['controllerID', 'deviceName', 'deviceType', 'ipAddress', 'status'],
  pumps: ['name', 'controllerID', 'plantID', 'gpioPort', 'type', 'status', 'flowRate']
}

async function fetchCollection(database, collectionName, query = {}) {
  return await database.collection(collectionName).find(query).toArray()
}

async function fetchAllSensorsDataForPastDay(database) {
  const oneDayAgo = Math.floor(Date.now() / 1000) - 86400 // Unix timestamp for 24 hours ago
  return await database
    .collection(COLLECTIONS.sensors)
    .aggregate([
      {
        $project: {
          _id: 0,
          sensorID: 1,
          sensorName: 1,
          controllerID: 1,
          gpioPort: 1,
          type: 1,
          readings: {
            $filter: {
              input: '$readings',
              as: 'reading',
              cond: { $gte: ['$$reading.timestamp', oneDayAgo] }
            }
          }
        }
      }
    ])
    .toArray()
}

function validateAttributes(items, requiredAttributes) {
  items.forEach((item) => {
    requiredAttributes.forEach((attr) => {
      if (item[attr] === undefined) {
        throw new Error(`Missing attribute ${attr} in data: ${JSON.stringify(item)}`)
      }
    })
  })
}

export const handler: Handler = async () => {
  let client
  try {
    client = await connectToDb()
    const database = client.db(DATABASE_NAME)

    const collections = await Promise.all([
      fetchCollection(database, COLLECTIONS.plants),
      fetchAllSensorsDataForPastDay(database),
      fetchCollection(database, COLLECTIONS.schedules),
      fetchCollection(database, COLLECTIONS.irrigationControllers, { deviceType: 'production' }),
      fetchCollection(database, COLLECTIONS.pumps)
    ])

    const [plantsArray, sensorsArray, schedulesArray, controllersArray, pumpsArray] = collections

    validateAttributes(plantsArray, REQUIRED_ATTRIBUTES.plants)
    validateAttributes(sensorsArray, REQUIRED_ATTRIBUTES.sensors)
    validateAttributes(schedulesArray, REQUIRED_ATTRIBUTES.schedules)
    validateAttributes(controllersArray, REQUIRED_ATTRIBUTES.controllers)
    validateAttributes(pumpsArray, REQUIRED_ATTRIBUTES.pumps)

    return {
      statusCode: 200,
      body: JSON.stringify({
        plantsArray,
        sensorsArray,
        schedulesArray,
        controllersArray,
        pumpsArray
      })
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: `Error: ${error.message}`
    }
  } finally {
    if (client) {
      await client.close()
    }
  }
}
