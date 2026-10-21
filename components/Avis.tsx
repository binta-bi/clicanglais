'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Avis = {
  id: string
  student_id: string
  auteur: string
  rating: number | null
  content: string
  created_at: string
}

const MAX = 1000

function Etoiles({ note }: { note: number }) {
  return (
    <span role="img" aria-label={`Note : ${note} sur 5`} className="text-brand-dark">
      {'★'.repeat(note)}
      <span className="text-line">{'★'.repeat(5 - note)}</span>
    </span>
  )
}

export default function AvisCours({ courseId }: { courseId: string }) {
  const [avis, setAvis] = useState<Avis[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [pret, setPret] = useState(false)
  const [texte, setTexte] = useState('')
  const [note, setNote] = useState(0)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from('reviews_public')
      .select('id, student_id, auteur, rating, content, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    setAvis((data as Avis[]) || [])
  }, [courseId])

  useEffect(() => {
    let annule = false
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('reviews_public')
        .select('id, student_id, auteur, rating, content, created_at')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
      if (annule) return
      setUserId(user?.id ?? null)
      setAvis((data as Avis[]) || [])
      setPret(true)
    }
    init()
    return () => {
      annule = true
    }
  }, [courseId])

  async function publier(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setErreur('')
    setEnvoi(true)
    const { error } = await supabase.from('reviews').insert({
      course_id: courseId,
      student_id: userId,
      rating: note || null,
      content: texte.trim(),
    })
    setEnvoi(false)
    if (error) {
      setErreur("Ton avis n'a pas pu être publié. Réessaie dans un instant.")
      return
    }
    setTexte('')
    setNote(0)
    charger()
  }

  async function supprimer(id: string) {
    if (!window.confirm('Supprimer ton avis ?')) return
    await supabase.from('reviews').delete().eq('id', id)
    charger()
  }

  const moyenne = avis.filter((a) => a.rating).length
    ? avis.reduce((t, a) => t + (a.rating ?? 0), 0) / avis.filter((a) => a.rating).length
    : null

  return (
    <section aria-labelledby="titre-avis" className="flex flex-col gap-5">
      <div>
        <h2 id="titre-avis" className="text-xl font-bold">
          Avis des élèves
        </h2>
        {moyenne !== null && (
          <p className="mt-1 text-ink/80">
            Note moyenne : <strong>{moyenne.toFixed(1).replace('.', ',')} / 5</strong> ({avis.length} avis)
          </p>
        )}
      </div>

      {pret && userId && (
        <form onSubmit={publier} className="flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-line">
          <label className="flex flex-col gap-1 font-medium">
            Ton avis
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={MAX}
              rows={3}
              required
              className="rounded-xl border-2 border-line px-3 py-2 text-base"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2">
              Note (facultatif)
              <select
                value={note}
                onChange={(e) => setNote(Number(e.target.value))}
                className="rounded-xl border-2 border-line px-2 py-1"
              >
                <option value={0}>Sans note</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} sur 5
                  </option>
                ))}
              </select>
            </label>
            <span className="text-sm text-ink/70">
              {texte.length} / {MAX}
            </span>
          </div>
          {erreur && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
              {erreur}
            </p>
          )}
          <button type="submit" disabled={envoi || !texte.trim()} className="btn-primary w-fit disabled:opacity-50">
            {envoi ? 'Publication...' : 'Publier mon avis'}
          </button>
        </form>
      )}

      {pret && !userId && (
        <p className="rounded-2xl bg-mist p-4">
          <Link href="/connexion" className="font-bold underline">
            Connecte-toi
          </Link>{' '}
          pour laisser un avis.
        </p>
      )}

      {pret && avis.length === 0 && <p className="text-ink/70">Aucun avis pour l&apos;instant.</p>}

      <ul className="flex flex-col gap-3">
        {avis.map((a) => (
          <li key={a.id} className="rounded-2xl p-4 ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                {a.auteur}
                {a.rating ? (
                  <>
                    {' '}
                    <Etoiles note={a.rating} />
                  </>
                ) : null}
              </p>
              <p className="text-sm text-ink/70">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <p className="mt-2 whitespace-pre-line break-words">{a.content}</p>
            {userId === a.student_id && (
              <button onClick={() => supprimer(a.id)} className="mt-2 text-sm font-medium text-red-700 underline">
                Supprimer mon avis
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
