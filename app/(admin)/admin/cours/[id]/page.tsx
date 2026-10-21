'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Segment = { start: number; end: number; text: string }
type Lesson = {
  id: string
  title: string
  video_url: string
  position: number
  transcription: Segment[] | null
}

function toSeconds(t: string) {
  const parts = t.trim().replace(',', '.').split(':').map(Number)
  return parts.reduce((total, p) => total * 60 + p, 0)
}

// Lit un fichier .srt ou .vtt et renvoie la liste des phrases avec leurs temps
function parseSousTitres(contenu: string): Segment[] {
  const segments: Segment[] = []
  const blocs = contenu.replace(/\r/g, '').split(/\n\s*\n/)
  for (const bloc of blocs) {
    const lignes = bloc.split('\n')
    const i = lignes.findIndex((l) => l.includes('-->'))
    if (i === -1) continue
    const [debut, fin] = lignes[i].split('-->')
    const texte = lignes
      .slice(i + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (!texte) continue
    segments.push({
      start: toSeconds(debut),
      end: toSeconds(fin.trim().split(' ')[0]),
      text: texte,
    })
  }
  return segments
}

function AdminLecons() {
  const { id } = useParams<{ id: string }>()
  const [titreCours, setTitreCours] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [fichier, setFichier] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    const { data: c } = await supabase.from('courses').select('title').eq('id', id).single()
    setTitreCours(c?.title || '')
    const { data } = await supabase
      .from('lessons')
      .select('id, title, video_url, position, transcription')
      .eq('course_id', id)
      .order('position')
    setLessons((data as Lesson[]) || [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setEnvoi(true)

    let transcription: Segment[] | null = null
    if (fichier) {
      transcription = parseSousTitres(await fichier.text())
      if (transcription.length === 0) {
        setMessage("Impossible de lire ce fichier. Utilise un fichier .srt ou .vtt.")
        setEnvoi(false)
        return
      }
    }

    const position = lessons.length > 0 ? Math.max(...lessons.map((l) => l.position)) + 1 : 1
    const { error } = await supabase.from('lessons').insert({
      course_id: id,
      title,
      video_url: videoUrl,
      transcription,
      position,
    })
    setEnvoi(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setTitle('')
    setVideoUrl('')
    setFichier(null)
    ;(document.getElementById('fichier') as HTMLInputElement).value = ''
    charger()
  }

  async function supprimer(l: Lesson) {
    if (!confirm(`Supprimer « ${l.title} » ?`)) return
    await supabase.from('lessons').delete().eq('id', l.id)
    charger()
  }

  async function deplacer(index: number, sens: -1 | 1) {
    const autre = lessons[index + sens]
    const courante = lessons[index]
    if (!autre) return
    await supabase.from('lessons').update({ position: autre.position }).eq('id', courante.id)
    await supabase.from('lessons').update({ position: courante.position }).eq('id', autre.id)
    charger()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/cours" className="text-sm text-[#2d3a6b]">← Mes cours</Link>
        <h1 className="text-2xl font-bold mt-2">Leçons : {titreCours}</h1>
      </div>

      <form onSubmit={ajouter} className="border rounded p-4 flex flex-col gap-3 max-w-xl">
        <h2 className="font-bold">Nouvelle leçon</h2>
        <input
          placeholder="Titre de la leçon" value={title} required
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="url" placeholder="Lien de la vidéo (https://...)" value={videoUrl} required
          onChange={(e) => setVideoUrl(e.target.value)}
          className="border p-2 rounded"
        />
        <label className="text-sm flex flex-col gap-1">
          Transcription (fichier .srt ou .vtt, facultatif)
          <input
            id="fichier" type="file" accept=".srt,.vtt"
            onChange={(e) => setFichier(e.target.files?.[0] || null)}
          />
        </label>
        {message && <p className="text-red-500 text-sm">{message}</p>}
        <button type="submit" disabled={envoi} className="bg-[#2d3a6b] text-white p-2 rounded disabled:opacity-50">
          {envoi ? 'Ajout...' : 'Ajouter la leçon'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {lessons.length === 0 && <p className="text-gray-500">Aucune leçon pour l&apos;instant.</p>}
        {lessons.map((l, i) => (
          <div key={l.id} className="border rounded p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">{i + 1}. {l.title}</p>
              <p className="text-sm text-gray-500">
                {l.transcription?.length
                  ? `Transcription : ${l.transcription.length} phrases`
                  : 'Pas de transcription'}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} className="border px-3 py-1 rounded disabled:opacity-30">↑</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === lessons.length - 1} className="border px-3 py-1 rounded disabled:opacity-30">↓</button>
              <button onClick={() => supprimer(l)} className="border border-red-500 text-red-500 px-3 py-1 rounded">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// useParams() doit être lu sous <Suspense> pour que le site se compile en production
export default function PageAdminLecons() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Chargement...</p>}>
      <AdminLecons />
    </Suspense>
  )
}
