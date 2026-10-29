'use client'
import { useEffect, useImperativeHandle, useRef } from 'react'
import { idYoutube } from '@/lib/youtube'

export type CommandesLecteur = { chercher: (secondes: number) => void }

type JoueurYT = {
  getCurrentTime: () => number
  seekTo: (s: number, avance: boolean) => void
  playVideo: () => void
  destroy: () => void
}
type YTGlobal = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      host?: string
      playerVars?: Record<string, number>
      events?: { onStateChange?: (e: { data: number }) => void }
    },
  ) => JoueurYT
}
declare global {
  interface Window {
    YT?: YTGlobal
    onYouTubeIframeAPIReady?: () => void
  }
}

let chargement: Promise<YTGlobal> | null = null
function chargerApiYoutube(): Promise<YTGlobal> {
  if (typeof window === 'undefined') return Promise.reject(new Error('serveur'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!chargement) {
    chargement = new Promise((ok, ko) => {
      const avant = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        avant?.()
        if (window.YT) ok(window.YT)
      }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      s.onerror = () => {
        chargement = null
        ko(new Error('YouTube indisponible'))
      }
      document.head.appendChild(s)
    })
  }
  return chargement
}

// Lecteur unique : vidéo YouTube (lien « non répertorié ») ou fichier vidéo direct (.mp4...)
export default function LecteurVideo({
  url,
  onTemps,
  onFin,
  ref,
}: {
  url: string
  onTemps: (secondes: number) => void
  onFin: () => void
  ref?: React.Ref<CommandesLecteur>
}) {
  const id = idYoutube(url)
  const conteneur = useRef<HTMLDivElement>(null)
  const joueur = useRef<JoueurYT | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const cbTemps = useRef(onTemps)
  const cbFin = useRef(onFin)
  useEffect(() => {
    cbTemps.current = onTemps
    cbFin.current = onFin
  })

  useImperativeHandle(ref, () => ({
    chercher(s: number) {
      if (id && joueur.current) {
        joueur.current.seekTo(s, true)
        joueur.current.playVideo()
      } else if (video.current) {
        video.current.currentTime = s
        video.current.play()
      }
    },
  }))

  useEffect(() => {
    if (!id || !conteneur.current) return
    let annule = false
    let minuteur: ReturnType<typeof setInterval> | undefined
    const cible = document.createElement('div')
    conteneur.current.replaceChildren(cible)
    chargerApiYoutube()
      .then((YT) => {
        if (annule) return
        joueur.current = new YT.Player(cible, {
          videoId: id,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: { onStateChange: (e) => e.data === 0 && cbFin.current() },
        })
        minuteur = setInterval(() => {
          const t = joueur.current?.getCurrentTime?.()
          if (typeof t === 'number') cbTemps.current(t)
        }, 500)
      })
      .catch(() => {
        if (conteneur.current)
          conteneur.current.textContent = 'La vidéo ne peut pas être chargée. Vérifie ta connexion puis recharge la page.'
      })
    return () => {
      annule = true
      if (minuteur) clearInterval(minuteur)
      joueur.current?.destroy?.()
      joueur.current = null
    }
  }, [id])

  if (id) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded bg-black text-white [&_iframe]:size-full">
        <div ref={conteneur} className="size-full" />
      </div>
    )
  }
  return (
    <video
      ref={video}
      src={url}
      controls
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      onTimeUpdate={(e) => onTemps(e.currentTarget.currentTime)}
      onEnded={onFin}
      className="w-full rounded bg-black"
    />
  )
}
