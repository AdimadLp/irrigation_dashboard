export async function fetchData(type: 'past' | 'new') {
  const response = await fetch(`/.netlify/functions/fetchDataHandler?type=${type}`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
