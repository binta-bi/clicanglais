import { supabase } from '@/lib/supabase'

export type TypePiece = 'image' | 'audio' | 'fichier'
export type Piece = { path: string; type: TypePiece; nom: string }

export const BUCKET = 'pieces-jointes'
export const TAILLE_MAX = 5 * 1024 * 1024 // 5 Mo
export const DUREE_VOCAL_MAX = 180 // secondes

const MIME_FICHIERS: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
}
const MIME_IMAGES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export const ACCEPT_FICHIERS = 'image/*,.pdf,.doc,.docx,.txt'

function extension(nom: string) {
  const i = nom.lastIndexOf('.')
  return i >= 0 ? nom.slice(i + 1).toLowerCase() : ''
}

// Réduit les grosses photos (téléphone) avant l'envoi : 1600 px max, JPEG
async function reduireImage(fichier: File): Promise<Blob> {
  if (fichier.type === 'image/gif') return fichier
  try {
    const bitmap = await createImageBitmap(fichier)
    const echelle = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * echelle)
    canvas.height = Math.round(bitmap.height * echelle)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.82))
    if (blob && (blob.size < fichier.size || fichier.type !== 'image/jpeg')) return blob
    return fichier
  } catch {
    throw new Error('Cette image ne peut pas être lue. Essaie une photo JPG ou PNG.')
  }
}

async function televerser(dossier: string, blob: Blob, ext: string, contentType: string) {
  if (blob.size > TAILLE_MAX) throw new Error('Fichier trop lourd (5 Mo maximum).')
  const path = `${dossier}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType, cacheControl: '3600' })
  if (error) throw new Error('Envoi impossible. Vérifie ta connexion et réessaie.')
  return path
}

// Photo ou fichier choisi par l'utilisateur
export async function envoyerFichierChoisi(dossier: string, fichier: File): Promise<Piece> {
  const ext = extension(fichier.name)
  const estImage = fichier.type.startsWith('image/') || ext in MIME_IMAGES
  if (estImage) {
    const blob = await reduireImage(fichier)
    const jpeg = blob.type === 'image/jpeg'
    const type = blob.type || MIME_IMAGES[ext] || 'image/jpeg'
    const extFinale = jpeg ? 'jpg' : type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'gif'
    const path = await televerser(dossier, blob, extFinale, type)
    return { path, type: 'image', nom: fichier.name.slice(0, 120) }
  }
  if (ext in MIME_FICHIERS) {
    const path = await televerser(dossier, fichier, ext, MIME_FICHIERS[ext])
    return { path, type: 'fichier', nom: fichier.name.slice(0, 120) }
  }
  throw new Error('Format non accepté. Envoie une photo, un PDF, un document Word ou un fichier texte.')
}

export async function envoyerVocal(dossier: string, blob: Blob): Promise<Piece> {
  const base = (blob.type || 'audio/webm').split(';')[0]
  const ext = base.includes('mp4') ? 'm4a' : base.includes('ogg') ? 'ogg' : base.includes('mpeg') ? 'mp3' : base.includes('wav') ? 'wav' : 'webm'
  const path = await televerser(dossier, blob, ext, base)
  return { path, type: 'audio', nom: 'Message vocal' }
}

// Liens temporaires (1 h) gardés en mémoire pour ne pas les redemander à chaque rafraîchissement
const cache = new Map<string, { url: string; exp: number }>()

export function urlEnCache(path: string, nom?: string) {
  const c = cache.get(path + '|' + (nom || ''))
  return c && c.exp > Date.now() ? c.url : null
}

export async function urlSignee(path: string, telecharger?: string): Promise<string | null> {
  const cle = path + '|' + (telecharger || '')
  const c = cache.get(cle)
  if (c && c.exp > Date.now()) return c.url
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600, telecharger ? { download: telecharger } : undefined)
  if (!data?.signedUrl) return null
  cache.set(cle, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 })
  return data.signedUrl
}
