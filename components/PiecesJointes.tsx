'use client'
import { useEffect, useRef, useState } from 'react'
import {
  ACCEPT_FICHIERS,
  DUREE_VOCAL_MAX,
  envoyerFichierChoisi,
  envoyerVocal,
  urlEnCache,
  urlSignee,
  type Piece,
  type TypePiece,
} from '@/lib/pieces-jointes'
import { IconeClip, IconeEnvoi, IconeFichier, IconeMicro, IconePoubelle } from '@/components/ChatUI'

// ---- Affichage d'une pièce jointe dans un message ---------------------------------
export function PieceAffichee({ path, type, nom }: { path: string; type: TypePiece; nom: string | null }) {
  const telecharger = type === 'fichier' ? nom || 'fichier' : undefined
  const [url, setUrl] = useState<string | null>(() => urlEnCache(path, telecharger))
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    if (url) return
    let annule = false
    urlSignee(path, telecharger).then((u) => {
      if (annule) return
      if (u) setUrl(u)
      else setErreur(true)
    })
    return () => {
      annule = true
    }
  }, [path, telecharger, url])

  if (erreur) return <p className="text-sm italic text-gray-500">Pièce jointe indisponible.</p>
  if (!url) return <p className="text-sm text-gray-500">Chargement de la pièce jointe...</p>

  if (type === 'image')
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={nom ? `Photo : ${nom}` : 'Photo envoyée'} className="max-h-72 max-w-full rounded-xl" loading="lazy" />
      </a>
    )
  if (type === 'audio')
    return (
      <audio controls preload="metadata" src={url} className="h-11 w-64 max-w-full" aria-label="Message vocal">
        Ton navigateur ne peut pas lire ce message vocal.
      </audio>
    )
  return (
    <a
      href={url}
      className="inline-flex items-center gap-3 rounded-xl bg-mist px-3 py-2.5 text-sm font-semibold text-ink hover:bg-line"
      download={nom || undefined}
    >
      <IconeFichier />
      <span className="[overflow-wrap:anywhere]">{nom || 'Télécharger le fichier'}</span>
    </a>
  )
}

// ---- Boutons : joindre une photo / un fichier, enregistrer un vocal -----------------
function formatDuree(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const MAX_FICHIERS = 10
const PAUSE_ENTRE_ENVOIS = 2300 // ms

export function BoutonsPieces({
  dossier,
  onPiece,
  desactive,
  champ,
  envoyer,
}: {
  dossier: string
  // renvoie false si le message n'a pas pu être envoyé (la page affiche déjà son erreur)
  onPiece: (p: Piece) => Promise<void | boolean>
  desactive?: boolean
  champ: React.ReactNode // le champ de texte du message
  envoyer: React.ReactNode // le bouton « Envoyer »
}) {
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'enregistre'>('repos')
  const [secondes, setSecondes] = useState(0)
  const [erreur, setErreur] = useState('')
  const [progres, setProgres] = useState('')
  const entree = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const flux = useRef<MediaStream | null>(null)
  const morceaux = useRef<Blob[]>([])
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null)
  const garder = useRef(true)
  const dernierOnPiece = useRef(onPiece)
  useEffect(() => {
    dernierOnPiece.current = onPiece
  })

  function arreterFlux() {
    if (minuteur.current) clearInterval(minuteur.current)
    minuteur.current = null
    flux.current?.getTracks().forEach((t) => t.stop())
    flux.current = null
  }

  useEffect(() => {
    return () => {
      garder.current = false
      if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
      arreterFlux()
    }
  }, [])

  async function livrer(fabrique: () => Promise<Piece>) {
    setEtat('envoi')
    setErreur('')
    try {
      const piece = await fabrique()
      await dernierOnPiece.current(piece)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Envoi impossible.')
    } finally {
      setEtat('repos')
    }
  }

  // Plusieurs fichiers à la fois : chacun part dans son propre message, l'un après l'autre.
  // Le texte déjà écrit accompagne le premier ; les autres partent sans texte.
  async function choisi(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files || [])
    e.target.value = ''
    if (fichiers.length === 0) return
    if (fichiers.length > MAX_FICHIERS) {
      setErreur(`${MAX_FICHIERS} fichiers maximum à la fois.`)
      return
    }
    setEtat('envoi')
    setErreur('')
    const echecs: string[] = []
    let dernierEnvoi = 0
    for (let i = 0; i < fichiers.length; i++) {
      setProgres(fichiers.length > 1 ? `${i + 1} / ${fichiers.length}` : '')
      try {
        const piece = await envoyerFichierChoisi(dossier, fichiers[i])
        // le club refuse deux messages à moins de 2 secondes d'écart : on attend si besoin
        const attente = dernierEnvoi + PAUSE_ENTRE_ENVOIS - Date.now()
        if (attente > 0) await new Promise((r) => setTimeout(r, attente))
        const reussi = await dernierOnPiece.current(piece)
        dernierEnvoi = Date.now()
        if (reussi === false) echecs.push(`${fichiers[i].name} : message non envoyé`)
        // laisse la page se mettre à jour (le texte envoyé est vidé) avant le fichier suivant
        await new Promise((r) => setTimeout(r, 50))
      } catch (err) {
        echecs.push(`${fichiers[i].name} : ${err instanceof Error ? err.message : 'envoi impossible'}`)
      }
    }
    setProgres('')
    setEtat('repos')
    if (echecs.length > 0) setErreur(echecs.join(' — '))
  }

  async function demarrerVocal() {
    setErreur('')
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErreur('Ton navigateur ne permet pas d’enregistrer un vocal.')
      return
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      flux.current = s
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m))
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined)
      recorder.current = r
      morceaux.current = []
      garder.current = true
      r.ondataavailable = (ev) => {
        if (ev.data.size > 0) morceaux.current.push(ev.data)
      }
      r.onstop = () => {
        const type = r.mimeType || mime || 'audio/webm'
        const blob = new Blob(morceaux.current, { type })
        arreterFlux()
        if (!garder.current || blob.size === 0) {
          setEtat('repos')
          return
        }
        livrer(() => envoyerVocal(dossier, blob))
      }
      r.start()
      setSecondes(0)
      setEtat('enregistre')
      minuteur.current = setInterval(() => {
        setSecondes((n) => {
          if (n + 1 >= DUREE_VOCAL_MAX && r.state !== 'inactive') r.stop()
          return n + 1
        })
      }, 1000)
    } catch {
      arreterFlux()
      setErreur('Micro inaccessible. Autorise le micro dans ton navigateur pour envoyer un vocal.')
    }
  }

  function terminerVocal(envoyer: boolean) {
    garder.current = envoyer
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
    else setEtat('repos')
  }

  const occupe = etat !== 'repos' || desactive

  return (
    <div className="flex flex-col gap-1.5">
      {etat === 'envoi' && (
        <p role="status" className="px-2 text-xs font-medium text-ardoise-texte">
          Envoi en cours{progres ? ` (${progres})` : ''}...
        </p>
      )}
      {etat === 'enregistre' ? (
        <div className="flex items-center gap-2" role="status">
          <button type="button" onClick={() => terminerVocal(false)} className="icone-rond !text-red-700 hover:!bg-red-50">
            <IconePoubelle />
            <span className="sr-only">Annuler</span>
          </button>
          <div className="flex min-h-11 flex-1 items-center gap-3 rounded-3xl bg-red-50 px-4 text-red-800">
            <span aria-hidden="true" className="inline-block size-3 animate-pulse rounded-full bg-red-600" />
            <span className="font-semibold tabular-nums">Enregistrement {formatDuree(secondes)}</span>
          </div>
          <button type="button" onClick={() => terminerVocal(true)} className="bouton-envoi">
            <IconeEnvoi />
            <span className="sr-only">Arrêter et envoyer</span>
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          <input ref={entree} type="file" accept={ACCEPT_FICHIERS} multiple onChange={choisi} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <button type="button" disabled={occupe} onClick={() => entree.current?.click()} className="icone-rond">
            <IconeClip />
            <span className="sr-only">Photos ou fichiers</span>
          </button>
          <div className="min-w-0 flex-1">{champ}</div>
          <button type="button" disabled={occupe} onClick={demarrerVocal} className="icone-rond">
            <IconeMicro />
            <span className="sr-only">Message vocal</span>
          </button>
          {envoyer}
        </div>
      )}
      {erreur && (
        <p role="alert" className="px-2 text-sm font-medium text-red-700">
          {erreur}
        </p>
      )}
    </div>
  )
}
