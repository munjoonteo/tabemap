// Usage: node upload.js <worker-url> <token>
// Example: node upload.js https://tabemap-api.xxx.workers.dev YOUR_TOKEN

import { readFileSync } from 'fs';

const [, , workerUrl, token] = process.argv;

if (!workerUrl || !token) {
  console.error('Usage: node upload.js <worker-url> <token>');
  process.exit(1);
}

async function main() {
  const data = readFileSync('../scraper/restaurants.json', 'utf-8');
  JSON.parse(data); // validate JSON before sending
  console.log(`Uploading to ${workerUrl}...`);

  const r = await fetch(`${workerUrl}/api/restaurants`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: data,
  });
  const text = await r.text();
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${text}`);
  if (!r.ok) throw new Error(`Upload failed with status ${r.status}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
