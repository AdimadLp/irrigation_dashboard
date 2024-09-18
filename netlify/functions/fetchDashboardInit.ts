import { type Handler } from '@netlify/functions'
import { connectToDb } from './dbConnect'

const DATABASE_NAME = 'irrigation_system'

async function fetchAllSensorsDataForPastDay(client) {
  const database = client.db(DATABASE_NAME)
  const collection = database.collection('sensors')

  const oneDayAgo = Math.floor(Date.now() / 1000) - 86400 // Unix timestamp for 24 hours ago
  //const oneDayAgo = Math.floor(Date.now() / 1000) - 60 // Unix timestamp for 1 minute ago
  const sensors = await collection
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

  sensors.forEach((sensor) => {
    const requiredAttributes = [
      'sensorID',
      'sensorName',
      'controllerID',
      'gpioPort',
      'type',
      'readings'
    ]
    requiredAttributes.forEach((attr) => {
      if (!Object.prototype.hasOwnProperty.call(sensor, attr)) {
        throw new Error(`Missing attribute ${attr} in sensor data: ${JSON.stringify(sensor)}`)
      }
    })
  })

  return sensors
}
async function fetchPlantProperties(client) {
  const database = client.db(DATABASE_NAME)
  const collection = database.collection('plants')

  const plants = await collection.find({}).toArray()

  plants.forEach((plant) => {
    const requiredAttributes = [
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
    ]

    requiredAttributes.forEach((attr) => {
      if (plant[attr] === undefined) {
        throw new Error(`Missing attribute ${attr} in plant data: ${JSON.stringify(plant)}`)
      }
    })
  })

  return plants
}
async function fetchScheduleProperties(client) {
  const database = client.db(DATABASE_NAME)
  const collection = database.collection('schedules')

  const schedules = await collection.find({}).toArray()

  schedules.forEach((schedule) => {
    const requiredAttributes = [
      'scheduleID',
      'weekdays',
      'startTime',
      'type',
      'plantID',
      'controllerID',
      'threshold'
    ]

    requiredAttributes.forEach((attr) => {
      if (schedule[attr] === undefined) {
        throw new Error(`Missing attribute ${attr} in schedule data: ${JSON.stringify(schedule)}`)
      }
    })
  })

  return schedules
}
async function fetchIrrigationControllers(client) {
  const database = client.db(DATABASE_NAME)
  const collection = database.collection('irrigation_controllers')

  const controllers = await collection.find({ deviceType: 'production' }).toArray()

  controllers.forEach((controller) => {
    const requiredAttributes = ['controllerID', 'deviceName', 'deviceType', 'ipAddress', 'status']

    requiredAttributes.forEach((attr) => {
      if (controller[attr] === undefined) {
        throw new Error(
          `Missing attribute ${attr} in controller data: ${JSON.stringify(controller)}`
        )
      }
    })
  })

  return controllers
}
export const handler: Handler = async () => {
  let plantsArray
  let sensorsArray
  let schedulesArray
  let controllersArray

  try {
    const client = await connectToDb()
    plantsArray = await fetchPlantProperties(client)
    sensorsArray = await fetchAllSensorsDataForPastDay(client)
    schedulesArray = await fetchScheduleProperties(client)
    controllersArray = await fetchIrrigationControllers(client)
    await client.close()
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: `Error connecting to MongoDB for plant properties`
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      plantsArray,
      sensorsArray,
      schedulesArray,
      controllersArray
    })
  }
}
