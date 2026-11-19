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

function EditerLecon({
  lecon,
  onFini,
  onAnnuler,
}: {
  lecon: Lesson
  onFini: () => void
  onAnnuler: () => void
}) {
  const [titre, setTitre] = useState(lecon.title)
  const [lien, setLien] = useState(lecon.video_url)
  const [fichier, setFichier] = useState<File | null>(null)
  const [retirer, setRetirer] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    const champs: { title: string; video_url: string; transcription?: Segment[] | null } = {
      title: titre.trim(),
      video_url: lien.trim(),
    }
    if (fichier) {
      const segments = parseSousTitres(await fichier.text())
      if (segments.length === 0) {
        setErreur('Impossible de lire ce fichier. Utilise un fichier .srt ou .vtt.')
        return
      }
      champs.transcription = segments
    } else if (retirer) {
      champs.transcription = null
    }
    setEnvoi(true)
    const { error } = await supabase.from('lessons').update(champs).eq('id', lecon.id)
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    onFini()
  }

  return (
    <form onSubmit={enregistrer} className="rounded-2xl bg-mist p-4 flex flex-col gap-3 ring-1 ring-line">
      <h3 className="font-bold">Modifier la leçon</h3>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Titre
        <input value={titre} required onChange={(e) => setTitre(e.target.value)} className="champ-auth !py-2 font-normal" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Lien de la vidéo
        <input type="url" value={lien} required onChange={(e) => setLien(e.target.value)} className="champ-auth !py-2 font-normal" />
      </label>
      <p className="text-sm text-ardoise-texte">
        {lecon.transcription?.length
          ? `Transcription actuelle : ${lecon.transcription.length} phrases.`
          : 'Cette leçon n\u2019a pas de transcription.'}
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Remplacer la transcription (fichier .srt ou .vtt, facultatif)
        <input type="file" accept=".srt,.vtt" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
      </label>
      {!!lecon.transcription?.length && !fichier && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={retirer} onChange={(e) => setRetirer(e.target.checked)} />
          Supprimer la transcription actuelle
        </label>
      )}
      {erreur && <p role="alert" className="text-red-500 text-sm">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={envoi} className="rounded-full bg-navy px-5 py-2.5 font-bold text-white transition-colors hover:bg-nuit disabled:opacity-50">
          {envoi ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onAnnuler} className="rounded-full border-2 border-line bg-white px-5 py-2 font-semibold text-nuit hover:border-royal">Annuler</button>
      </div>
    </form>
  )
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
  const [edition, setEdition] = useState<string | null>(null)

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
        <Link href="/admin/cours" className="text-sm font-semibold text-royal">← Mes cours</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-nuit mt-2">Leçons : {titreCours}</h1>
        <Link href={`/admin/cours/${id}/modifier`} className="inline-block mt-2 text-sm rounded-full border-2 border-navy px-4 py-1.5 font-semibold text-navy hover:bg-navy hover:text-white">
          Modifier les infos du cours
        </Link>
      </div>

      <form onSubmit={ajouter} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line flex flex-col gap-3 max-w-xl">
        <h2 className="font-bold">Nouvelle leçon</h2>
        <input
          placeholder="Titre de la leçon" value={title} required
          onChange={(e) => setTitle(e.target.value)}
          className="champ-auth !py-2"
        />
        <input
          type="url" placeholder="Lien de la vidéo (https://...)" value={videoUrl} required
          onChange={(e) => setVideoUrl(e.target.value)}
          className="champ-auth !py-2"
        />
        <label className="text-sm flex flex-col gap-1">
          Transcription (fichier .srt ou .vtt, facultatif)
          <input
            id="fichier" type="file" accept=".srt,.vtt"
            onChange={(e) => setFichier(e.target.files?.[0] || null)}
          />
        </label>
        {message && <p className="text-red-500 text-sm">{message}</p>}
        <button type="submit" disabled={envoi} className="rounded-xl bg-navy px-4 py-2 font-bold text-white hover:bg-nuit disabled:opacity-50">
          {envoi ? 'Ajout...' : 'Ajouter la leçon'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {lessons.length === 0 && <p className="text-ardoise-texte">Aucune leçon pour l&apos;instant.</p>}
        {lessons.map((l, i) =>
          edition === l.id ? (
            <EditerLecon
              key={l.id}
              lecon={l}
              onFini={() => {
                setEdition(null)
                charger()
              }}
              onAnnuler={() => setEdition(null)}
            />
          ) : (
            <div key={l.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{i + 1}. {l.title}</p>
                <p className="text-sm text-ardoise-texte">
                  {l.transcription?.length
                    ? `Transcription : ${l.transcription.length} phrases`
                    : 'Pas de transcription'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button onClick={() => deplacer(i, -1)} disabled={i === 0} className="rounded-full border-2 border-line bg-white px-4 py-1.5 font-semibold text-nuit hover:border-royal disabled:opacity-30">↑</button>
                <button onClick={() => deplacer(i, 1)} disabled={i === lessons.length - 1} className="rounded-full border-2 border-line bg-white px-4 py-1.5 font-semibold text-nuit hover:border-royal disabled:opacity-30">↓</button>
                <button onClick={() => setEdition(l.id)} className="rounded-full border-2 border-navy px-4 py-1.5 font-semibold text-navy hover:bg-navy hover:text-white">Modifier</button>
                <button onClick={() => supprimer(l)} className="rounded-full border-2 border-red-500 px-4 py-1.5 font-semibold text-red-600 hover:bg-red-50">Supprimer</button>
              </div>
            </div>
          ),
        )}
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
