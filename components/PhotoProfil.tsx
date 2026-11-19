'use client'
// Ma photo de profil : choisir, recadrer en carré, envoyer, retirer.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ChatUI'
import { oublierAvatar, useAvatars } from '@/lib/avatars'

const TAILLE_MAX = 8 * 1024 * 1024 // photo d'origine : 8 Mo maximum
const COTE = 256 // la photo envoyée fait 256 x 256 pixels

function recadrer(fichier: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier)
    const img = new Image()
    img.onload = () => {
      const c = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = COTE
      canvas.height = COTE
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Image impossible à traiter.'))
        return
      }
      ctx.drawImage(img, (img.width - c) / 2, (img.height - c) / 2, c, c, 0, 0, COTE, COTE)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image impossible à traiter.'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Ce fichier n’est pas une image lisible.'))
    }
    img.src = url
  })
}

export default function PhotoProfil({ nom = 'Moi' }: { nom?: string }) {
  const [uid, setUid] = useState('')
  const [version, setVersion] = useState(0)
  const [occupe, setOccupe] = useState(false)
  const [info, setInfo] = useState('')
  const [erreur, setErreur] = useState('')
  const champ = useRef<HTMLInputElement>(null)
  const photos = useAvatars(uid ? [uid] : [], version)
  const url = uid ? photos[uid] : null

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? ''))
  }, [])

  async function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier || !uid) return
    setErreur('')
    setInfo('')
    if (!fichier.type.startsWith('image/')) {
      setErreur('Choisis une image (JPG, PNG ou WebP).')
      return
    }
    if (fichier.size > TAILLE_MAX) {
      setErreur('Cette image est trop lourde (8 Mo maximum).')
      return
    }
    setOccupe(true)
    try {
      const blob = await recadrer(fichier)
      const chemin = `${uid}/${Date.now()}.jpg`
      const { error: e1 } = await supabase.storage.from('avatars').upload(chemin, blob, { contentType: 'image/jpeg' })
      if (e1) throw new Error(e1.message)
      const { data } = supabase.storage.from('avatars').getPublicUrl(chemin)
      const { error: e2 } = await supabase.rpc('mon_avatar', { p_url: data.publicUrl })
      if (e2) throw new Error(e2.message)
      // nettoie les anciennes photos (sans importance si cela échoue)
      const { data: liste } = await supabase.storage.from('avatars').list(uid)
      const anciennes = (liste || []).map((f) => `${uid}/${f.name}`).filter((p) => p !== chemin)
      if (anciennes.length) await supabase.storage.from('avatars').remove(anciennes)
      oublierAvatar(uid)
      setVersion((v) => v + 1)
      setInfo('Ta photo est enregistrée.')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La photo n’a pas pu être envoyée.')
    }
    setOccupe(false)
  }

  async function retirer() {
    if (!uid) return
    setErreur('')
    setInfo('')
    setOccupe(true)
    const { error } = await supabase.rpc('mon_avatar', { p_url: null })
    if (error) setErreur(error.message)
    else {
      const { data: liste } = await supabase.storage.from('avatars').list(uid)
      const tous = (liste || []).map((f) => `${uid}/${f.name}`)
      if (tous.length) await supabase.storage.from('avatars').remove(tous)
      oublierAvatar(uid)
      setVersion((v) => v + 1)
      setInfo('Ta photo est retirée.')
    }
    setOccupe(false)
  }

  if (!uid) return null

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-2.5 sm:px-5">
      <Avatar nom={nom} src={url} className="size-10 text-sm" />
      <div className="flex flex-wrap items-center gap-2">
        <input ref={champ} id="photo-profil" type="file" accept="image/*" onChange={choisir} className="sr-only" />
        <button
          type="button"
          onClick={() => champ.current?.click()}
          disabled={occupe}
          className="rounded-full bg-mist px-3.5 py-1.5 text-sm font-semibold text-navy ring-1 ring-line transition-colors hover:bg-white disabled:opacity-50"
        >
          {occupe ? 'Envoi...' : url ? 'Changer ma photo' : 'Ajouter ma photo'}
        </button>
        {url && !occupe && (
          <button type="button" onClick={retirer} className="px-2 py-1.5 text-sm font-semibold text-ardoise-texte underline">
            Retirer ma photo
          </button>
        )}
      </div>
      <p role={erreur ? 'alert' : 'status'} className={`text-sm ${erreur ? 'font-medium text-red-800' : 'text-ardoise-texte'}`}>
        {erreur || info}
      </p>
    </div>
  )
}
