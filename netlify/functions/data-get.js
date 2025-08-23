export async function handler() {
  try {
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/playlists.json`

    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })
    if (!res.ok) throw new Error('Failed to load data')

    const text = await res.text()
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: text,
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
