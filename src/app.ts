import { readData } from './cosmosService'

function displayData(data: any) {
  // Implement this function to display the data on your main page.
  console.log(data)
}

export async function fetchData() {
  try {
    const data = await readData()
    displayData(data)
  } catch (error) {
    console.error('Error reading data:', error)
  }
}

// Fetch data every 5 seconds
setInterval(fetchData, 5000)
