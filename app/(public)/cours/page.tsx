'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

type Cours = { id: string; title: string; description: string | null; niveau: NiveauSlug; mois: number | null }
type Filtre = 'tous' | NiveauSlug

const PHOTO: Record<string, string> = {
  debutant: '/niveau-debutant.jpg',
  intermediaire: '/niveau-intermediaire.jpg',
  avance: '/niveau-avance.jpg',
}
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
    <div className="hero-ivoire min-h-[calc(100dvh-4.2rem)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-7 px-4 py-10 sm:py-14">
        <header>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-nuit sm:text-4xl">Nos cours</h1>
          <p className="mt-2 max-w-xl text-lg leading-relaxed text-ardoise-texte">
            Trois niveaux, un programme par mois. Choisis le tien et découvre les leçons.
          </p>
        </header>

        <div role="group" aria-label="Filtrer par niveau" className="flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <button
              key={f.valeur}
              type="button"
              onClick={() => setFiltre(f.valeur)}
              aria-pressed={filtre === f.valeur}
              className={`rounded-full px-5 py-2.5 text-sm font-bold ring-1 transition-colors ${
                filtre === f.valeur
                  ? 'bg-nuit text-white ring-nuit'
                  : 'bg-white text-nuit ring-line hover:ring-royal'
              }`}
            >
              {f.nom}
            </button>
          ))}
        </div>

        {chargement && <p role="status">Chargement...</p>}
        {!chargement && visibles.length === 0 && (
          <p className="rounded-2xl bg-white p-5 ring-1 ring-line">Aucun cours disponible pour ce niveau pour l&apos;instant.</p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((c) => (
            <Link
              key={c.id}
              href={`/cours/${c.id}`}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_44px_-30px_rgb(20_36_58/0.55)] ring-1 ring-nuit/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgb(20_36_58/0.6)]"
            >
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-royal to-nuit">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${PHOTO[c.niveau] ?? PHOTO.debutant})` }}
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-nuit/80 to-transparent" />
                <span className="absolute bottom-3 left-4 rounded-full bg-cuivre px-3 py-1 text-xs font-extrabold text-nuit">
                  {NOM_NIVEAU[c.niveau] ?? c.niveau}
                  {c.mois ? ` · Mois ${c.mois}` : ''}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="text-lg font-extrabold leading-snug text-nuit">{c.title}</h2>
                {c.description && <p className="line-clamp-3 leading-relaxed text-ardoise-texte">{c.description}</p>}
                <p className="text-sm text-ardoise-texte">
                  Niveau {NOM_NIVEAU[c.niveau] ?? c.niveau}
                  {c.mois ? ` · Mois ${c.mois} sur 3` : ''}
                </p>
                <p className="mt-auto pt-2 font-bold text-royal">Voir le cours →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
