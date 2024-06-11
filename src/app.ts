import { read_last_sensor_data } from './cosmosService'

export async function fetchData() {
  const last_sensor_data = await read_last_sensor_data()
  console.log(last_sensor_data)
  return last_sensor_data
}
