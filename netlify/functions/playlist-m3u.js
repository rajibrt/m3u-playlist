function toM3U(json) {
  const lines = ['#EXTM3U']
  for (const group of json.groups || []) {
    for (const ch of group.channels || []) {
      if (!ch?.url || !ch?.title) continue
      const tvgId = ch.tvgId ? ` tvg-id="${ch.tvgId}"` : ''
      const tvgName = ch.title ? ` tvg-name="${ch.title}"` : ''
      const tvgLogo = ch.logo ? ` tvg-logo="${ch.logo}"` : ''
      const groupTitle = group.name ? ` group-title="${group.name}"` : ''
      lines.push(
        `#EXTINF:-1${tvgId}${tvgName}${tvgLogo}${groupTitle},${ch.title}`
      )
      lines.push(ch.url)
    }
  }
  return lines.join('\n') + '\n'
}

export async function handler() {
  try {
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/playlists.json`
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })
    if (!res.ok) throw new Error('Failed to load data')

    const json = await res.json()
    const m3u = toM3U(json)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/x-mpegurl; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: m3u,
    }
  } catch (e) {
    const fail = `#EXTM3U\n# ERROR: ${e.message}\n`
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'audio/x-mpegurl' },
      body: fail,
    }
  }
}
