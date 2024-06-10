import { readData } from './cosmosService'

export async function fetchData() {
  const data = await readData()
  console.log(data)
  return data
}
