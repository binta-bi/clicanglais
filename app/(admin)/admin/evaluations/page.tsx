'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

type Ligne = {
  code: string
  niveau: NiveauSlug
  mois: number | null
  titre: string
  is_published: boolean
  nb_questions: number
  nb_tentatives: number
  moyenne_pct: number | null
}

export default function PageEvaluations() {
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    async function charger() {
      const { data, error } = await supabase.rpc('prof_eval_liste')
      if (error) setErreur(error.message)
      setLignes((data as Ligne[]) || [])
      setChargement(false)
    }
    charger()
  }, [])

  if (chargement) return <p>Chargement...</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Évaluations</h1>
      <p className="text-sm text-gray-600">
        Une évaluation par mois et une par niveau. Les élèves la passent une seule fois, en 30 minutes. Elle
        n&apos;apparaît chez eux qu&apos;une fois publiée.
      </p>
      {erreur && (
        <p role="alert" className="text-red-500 text-sm">
          {erreur}
        </p>
      )}
      {(['debutant', 'intermediaire', 'avance'] as NiveauSlug[]).map((n) => (
        <section key={n} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Niveau {NOM_NIVEAU[n]}</h2>
          {lignes
            .filter((l) => l.niveau === n)
            .map((l) => (
              <div key={l.code} className="border rounded p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{l.titre}</p>
                  <p className="text-sm text-gray-600">
                    {l.nb_questions} question{l.nb_questions > 1 ? 's' : ''} ·{' '}
                    {l.is_published ? 'Publiée' : 'Brouillon'} · {l.nb_tentatives} passage
                    {l.nb_tentatives > 1 ? 's' : ''}
                    {l.moyenne_pct !== null && ` · moyenne ${l.moyenne_pct} %`}
                  </p>
                </div>
                <Link
                  href={`/admin/evaluations/${l.code}`}
                  className="border border-[#2d3a6b] text-[#2d3a6b] px-3 py-1 rounded text-sm"
                >
                  Gérer
                </Link>
              </div>
            ))}
        </section>
      ))}
    </div>
  )
}
