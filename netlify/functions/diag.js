// netlify/functions/diag.js
export async function handler() {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'

  const result = {
    env: {
      hasToken: !!token,
      owner,
      repo,
      branch,
    },
    github: {},
  }

  try {
    const res = await fetch('https://api.github.com/rate_limit', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    result.github.rate_limit_status = res.status
    result.github.rate_limit_body = await res.json()
  } catch (e) {
    result.github.rate_limit_error = String(e.message || e)
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(result, null, 2),
  }
}
