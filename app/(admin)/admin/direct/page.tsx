'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Cours = { id: string; title: string }
type Seance = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  join_url: string | null
  replay_url: string | null
  courses: { title: string } | null
}

function quand(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDirect() {
  const [cours, setCours] = useState<Cours[]>([])
  const [seances, setSeances] = useState<Seance[]>([])
  const [replays, setReplays] = useState<Record<string, string>>({})
  const [courseId, setCourseId] = useState('')
  const [titre, setTitre] = useState('Séance en direct')
  const [debut, setDebut] = useState('')
  const [duree, setDuree] = useState(120)
  const [lien, setLien] = useState('')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [maintenant, setMaintenant] = useState(0)

  const charger = useCallback(async () => {
    const { data: c } = await supabase
      .from('courses')
      .select('id, title')
      .not('mois', 'is', null)
      .order('niveau')
      .order('mois')
    setCours((c as Cours[]) || [])
    const { data } = await supabase
      .from('live_sessions')
      .select('id, title, starts_at, ends_at, join_url, replay_url, courses(title)')
      .order('starts_at', { ascending: false })
    const liste = (data as unknown as Seance[]) || []
    setSeances(liste)
    setMaintenant(Date.now())
    setReplays(Object.fromEntries(liste.map((s) => [s.id, s.replay_url ?? ''])))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    if (!courseId) {
      setMessage('Choisis le cours concerné.')
      return
    }
    const d = new Date(debut)
    if (Number.isNaN(d.getTime())) {
      setMessage('Indique la date et l’heure de début.')
      return
    }
    setEnvoi(true)
    const { error } = await supabase.from('live_sessions').insert({
      course_id: courseId,
      title: titre.trim(),
      starts_at: d.toISOString(),
      ends_at: new Date(d.getTime() + duree * 60000).toISOString(),
      join_url: lien.trim() || null,
    })
    setEnvoi(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setDebut('')
    setLien('')
    charger()
  }

  async function enregistrerReplay(s: Seance) {
    setMessage('')
    const { error } = await supabase
      .from('live_sessions')
      .update({ replay_url: replays[s.id]?.trim() || null })
      .eq('id', s.id)
    if (error) setMessage(error.message)
    else charger()
  }

  async function supprimer(s: Seance) {
    if (!window.confirm(`Supprimer « ${s.title} » ?`)) return
    const { error } = await supabase.from('live_sessions').delete().eq('id', s.id)
    if (error) setMessage(error.message)
    else charger()
  }

  const champ = 'border p-2 rounded'

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Cours en direct</h1>

      <form onSubmit={ajouter} className="border rounded p-4 flex flex-col gap-3 max-w-xl">
        <h2 className="font-bold">Programmer une séance</h2>
        <label className="flex flex-col gap-1 text-sm">
          Cours concerné
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={champ} required>
            <option value="">Choisis un cours</option>
            {cours.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Titre
          <input value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} required maxLength={200} />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Début
            <input type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} className={champ} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Durée
            <select value={duree} onChange={(e) => setDuree(Number(e.target.value))} className={champ}>
              {[60, 90, 120, 150, 180].map((m) => (
                <option key={m} value={m}>
                  {Math.floor(m / 60)} h{m % 60 ? ` ${m % 60}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Lien de la séance (Zoom, Google Meet...)
          <input type="url" value={lien} onChange={(e) => setLien(e.target.value)} placeholder="https://..." className={champ} />
        </label>
        {message && (
          <p role="alert" className="text-red-500 text-sm">
            {message}
          </p>
        )}
        <button type="submit" disabled={envoi} className="bg-[#2d3a6b] text-white p-2 rounded disabled:opacity-50">
          {envoi ? 'Ajout...' : 'Ajouter la séance'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {seances.length === 0 && <p className="text-gray-500">Aucune séance programmée.</p>}
        {seances.map((s) => {
          const finie = maintenant > 0 && new Date(s.ends_at).getTime() < maintenant
          return (
            <div key={s.id} className="border rounded p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">{s.courses?.title}</p>
                  <p className="font-bold">{s.title}</p>
                  <p className="first-letter:uppercase">{quand(s.starts_at)}</p>
                  {finie && !s.replay_url && <p className="text-sm text-[#e8652d]">Séance terminée : ajoute la rediffusion.</p>}
                </div>
                <button onClick={() => supprimer(s)} className="border border-red-500 text-red-500 px-3 py-1 rounded text-sm">
                  Supprimer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="url"
                  aria-label={`Lien de la rediffusion pour ${s.title}`}
                  placeholder="Lien de la rediffusion (https://...)"
                  value={replays[s.id] ?? ''}
                  onChange={(e) => setReplays((r) => ({ ...r, [s.id]: e.target.value }))}
                  className={`${champ} flex-1 min-w-48`}
                />
                <button onClick={() => enregistrerReplay(s)} className="border px-3 py-1 rounded">
                  Enregistrer
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
