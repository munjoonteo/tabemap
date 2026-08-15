// Usage: node upload.js <worker-url> <token>
// Example: node upload.js https://tabemap-api.xxx.workers.dev YOUR_TOKEN

const [, , workerUrl, token] = process.argv

if (!workerUrl || !token) {
  console.error('Usage: node upload.js <worker-url> <token>')
  process.exit(1)
}

import('fs').then(({ readFileSync }) => {
  const data = readFileSync('../scraper/restaurants.json', 'utf-8')
  // validate first
  JSON.parse(data)
  console.log(`Uploading to ${workerUrl}...`)

  fetch(`${workerUrl}/api/restaurants`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: data,
  })
    .then(async r => {
      const text = await r.text()
      console.log(`Status: ${r.status}`)
      console.log(`Body: ${text}`)
    })
    .catch(err => console.error('Error:', err))
})
