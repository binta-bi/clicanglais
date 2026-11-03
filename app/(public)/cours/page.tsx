'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

type Cours = { id: string; title: string; description: string | null; niveau: NiveauSlug; mois: number | null }
type Filtre = 'tous' | NiveauSlug

const ORDRE: Record<string, number> = { debutant: 0, intermediaire: 1, avance: 2 }
const FILTRES: { valeur: Filtre; nom: string }[] = [
  { valeur: 'tous', nom: 'Tous' },
  { valeur: 'debutant', nom: 'Débutant' },
  { valeur: 'intermediaire', nom: 'Intermédiaire' },
  { valeur: 'avance', nom: 'Avancé' },
]

// Les prix ne sont affichés que sur la page d'accueil.
export default function PageCours() {
  const [cours, setCours] = useState<Cours[]>([])
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from('courses')
        .select('id, title, description, niveau, mois')
        .eq('is_published', true)
        .not('mois', 'is', null)
      const liste = ((data as Cours[]) || []).sort(
        (a, b) => (ORDRE[a.niveau] ?? 9) - (ORDRE[b.niveau] ?? 9) || (a.mois ?? 0) - (b.mois ?? 0),
      )
      setCours(liste)
      setChargement(false)
    }
    charger()
  }, [])

  const visibles = cours.filter((c) => filtre === 'tous' || c.niveau === filtre)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Nos cours</h1>

      <div role="group" aria-label="Filtrer par niveau" className="flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.valeur}
            type="button"
            onClick={() => setFiltre(f.valeur)}
            aria-pressed={filtre === f.valeur}
            className={`rounded-lg border px-4 py-2 font-medium ${
              filtre === f.valeur ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white' : 'border-[#2d3a6b] text-[#1a2250] hover:text-brand-deep'
            }`}
          >
            {f.nom}
          </button>
        ))}
      </div>

      {chargement && <p role="status">Chargement...</p>}
      {!chargement && visibles.length === 0 && (
        <p className="rounded-2xl bg-mist p-5">Aucun cours disponible pour ce niveau pour l&apos;instant.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visibles.map((c) => (
          <Link key={c.id} href={`/cours/${c.id}`} className="rounded-lg border border-[#2d3a6b] p-5 flex flex-col gap-2 hover:shadow">
            <h2 className="font-bold">{c.title}</h2>
            {c.description && <p>{c.description}</p>}
            <p className="text-sm text-gray-500">
              Niveau {NOM_NIVEAU[c.niveau] ?? c.niveau}
              {c.mois ? ` · Mois ${c.mois} sur 3` : ''}
            </p>
            <p className="font-medium text-brand-deep">Voir le cours →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
