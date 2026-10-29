// Reconnaît un lien YouTube (youtu.be, watch?v=, embed, shorts, live) et renvoie l'identifiant de la vidéo
export function idYoutube(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const h = u.hostname.replace(/^(www\.|m\.)/, '')
    let id: string | null = null
    if (h === 'youtu.be') id = u.pathname.split('/')[1] || null
    else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v')
      else {
        const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/)
        id = m ? m[2] : null
      }
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null
  } catch {
    return null
  }
}
