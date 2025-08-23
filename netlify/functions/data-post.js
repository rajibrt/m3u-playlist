export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    // Simple CORS for same-origin dashboard or manual curl
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
    }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const token = process.env.GITHUB_TOKEN // scope: public_repo (public repo) বা repo (private হলে)
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'
    const path = 'data/playlists.json'

    const newContent = event.body || '{}'

    // বর্তমান ফাইল SHA আনুন
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'netlify-fn',
        },
      }
    )
    if (!getRes.ok) throw new Error('Failed to get current file')
    const getJson = await getRes.json()
    const sha = getJson.sha

    // Base64 encode করে কমিট
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'netlify-fn',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update playlists.json via dashboard',
          content: Buffer.from(newContent, 'utf8').toString('base64'),
          sha,
          branch,
        }),
      }
    )

    if (!putRes.ok) {
      const t = await putRes.text()
      throw new Error(`Failed to save: ${t}`)
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Saved',
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
