'use client'
// Avis des élèves sur la page d'accueil : visibles par tous, le professeur peut supprimer un avis.
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ChatUI'

type Avis = {
  id: string
  course_id: string
  auteur: string
  rating: number | null
  content: string
  created_at: string
}

const PAR_DEFAUT = 6

function Etoiles({ note }: { note: number }) {
  return (
    <span role="img" aria-label={`Note : ${note} sur 5`} className="text-lg leading-none tracking-wider text-brand-dark">
      {'★'.repeat(note)}
      <span className="text-line">{'★'.repeat(5 - note)}</span>
    </span>
  )
}

export default function AvisAccueil() {
  const [avis, setAvis] = useState<Avis[]>([])
  const [cours, setCours] = useState<Record<string, string>>({})
  const [prof, setProf] = useState(false)
  const [tous, setTous] = useState(false)
  const [erreur, setErreur] = useState('')
  const [pret, setPret] = useState(false)

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from('reviews_public')
      .select('id, course_id, auteur, rating, content, created_at')
      .order('created_at', { ascending: false })
      .limit(30)
    setAvis((data as Avis[]) || [])
  }, [])

  useEffect(() => {
    let annule = false
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const [{ data }, { data: c }, role] = await Promise.all([
        supabase
          .from('reviews_public')
          .select('id, course_id, auteur, rating, content, created_at')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('courses').select('id, title').eq('is_published', true),
        user ? supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      ])
      if (annule) return
      setAvis((data as Avis[]) || [])
      setCours(Object.fromEntries(((c as { id: string; title: string }[]) || []).map((x) => [x.id, x.title])))
      setProf((role.data as { role: string } | null)?.role === 'professeur')
      setPret(true)
    }
    init()
    return () => {
      annule = true
    }
  }, [])

  async function supprimer(a: Avis) {
    if (!window.confirm(`Supprimer l’avis de ${a.auteur} ?`)) return
    const { error } = await supabase.from('reviews').delete().eq('id', a.id)
    if (error) {
      setErreur('La suppression a échoué. Réessaie dans un instant.')
      return
    }
    setErreur('')
    charger()
  }

  // Pas d'avis : on n'affiche pas la section (rien de vide pour les visiteurs)
  if (!pret || avis.length === 0) return null

  const notes = avis.filter((a) => a.rating)
  const moyenne = notes.length ? notes.reduce((t, a) => t + (a.rating ?? 0), 0) / notes.length : null
  const visibles = tous ? avis : avis.slice(0, PAR_DEFAUT)

  return (
    <section aria-labelledby="titre-avis-accueil" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-bold uppercase tracking-wide text-royal">Ils en parlent</p>
        <h2 id="titre-avis-accueil" className="mt-2 max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          Ce que disent nos élèves
        </h2>
        {moyenne !== null && (
          <p className="mt-3 text-lg text-ardoise-texte">
            Note moyenne : <strong className="text-nuit">{moyenne.toFixed(1).replace('.', ',')} / 5</strong> ({avis.length} avis)
          </p>
        )}

        {erreur && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 font-medium text-red-800">
            {erreur}
          </p>
        )}

        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibles.map((a) => (
            <li
              key={a.id}
              className="flex flex-col rounded-3xl bg-ivoire p-6 shadow-[0_20px_44px_-34px_rgb(20_36_58/0.55)] ring-1 ring-nuit/10"
            >
              {a.rating ? <Etoiles note={a.rating} /> : null}
              <p className="mt-3 flex-1 whitespace-pre-line break-words leading-relaxed text-nuit">« {a.content} »</p>
              <div className="mt-5 flex items-center gap-3">
                <Avatar nom={a.auteur} className="size-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-nuit">{a.auteur}</p>
                  <p className="truncate text-sm text-ardoise-texte">
                    {cours[a.course_id] ? `${cours[a.course_id]} · ` : ''}
                    {new Date(a.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {prof && (
                <button
                  onClick={() => supprimer(a)}
                  className="mt-4 self-start rounded-full border-2 border-red-500 px-4 py-1 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Supprimer cet avis
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {avis.length > PAR_DEFAUT && (
            <button
              onClick={() => setTous((v) => !v)}
              aria-expanded={tous}
              className="rounded-full border-2 border-line bg-white px-5 py-2 font-semibold text-nuit hover:border-royal"
            >
              {tous ? 'Voir moins d’avis' : `Voir tous les avis (${avis.length})`}
            </button>
          )}
          {prof && (
            <Link href="/admin/avis" className="font-semibold text-royal underline-offset-4 hover:underline">
              Gérer tous les avis
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
