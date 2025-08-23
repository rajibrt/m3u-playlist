// netlify/functions/data-post.js
import { Buffer } from 'node:buffer' // ✅ ensure Buffer exists in bundle

export async function handler(event) {
  // CORS (same-origin, কিন্তু থাকলে ভাল)
  if (event.httpMethod === 'OPTIONS') {
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
    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'
    const path = 'data/playlists.json'

    if (!token || !owner || !repo) {
      throw new Error(
        `Missing env vars. Have: OWNER=${!!owner}, REPO=${!!repo}, TOKEN=${!!token}.`
      )
    }

    const newContent = event.body || '{}'

    // 1) বর্তমান ফাইলের SHA আনুন (না পেলে 404 → নতুন ফাইল)
    let sha = null
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'netlify-fn',
        },
      }
    )

    if (getRes.ok) {
      const getJson = await getRes.json()
      sha = getJson.sha
    } else if (getRes.status !== 404) {
      const t = await getRes.text()
      throw new Error(`GET contents failed (status ${getRes.status}): ${t}`)
    }

    // 2) create/update
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
          message: sha
            ? 'Update playlists.json via dashboard'
            : 'Create playlists.json via dashboard',
          content: Buffer.from(newContent, 'utf8').toString('base64'),
          ...(sha ? { sha } : {}),
          branch,
        }),
      }
    )

    if (!putRes.ok) {
      const t = await putRes.text()
      throw new Error(`PUT contents failed (status ${putRes.status}): ${t}`)
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Saved',
    }
  } catch (e) {
    // লগে লিখুন এবং রেসপন্সে এরর পাঠান—ব্রাউজারের Network ট্যাব থেকে পড়া যাবে
    console.error('[data-post] error:', e)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: String(e.message || e) }),
    }
  }
}
