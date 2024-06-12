export async function fetchData() {
  try {
    const response = await fetch('/.netlify/functions/fetchDataHandler')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}
