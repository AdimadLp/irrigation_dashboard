export async function fetchData() {
  const response = await fetch('/.netlify/functions/fetchDataHandler')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
