'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Periode = { visites: number; pages: number }
type Stats = {
  aujourdhui: Periode
  sept_jours: Periode
  trente_jours: Periode & { connectes: number; anonymes: number }
  par_jour: { jour: string; visites: number; pages: number }[]
  top_pages: { chemin: string; vues: number }[]
}

const NOMS_PAGES: Record<string, string> = {
  '/': 'Accueil',
  '/cours': 'Liste des cours',
  '/cours/[id]': 'Fiche d’un cours',
  '/inscription': 'Inscription',
  '/connexion': 'Connexion',
  '/niveau': 'Choix du niveau',
  '/mes-cours': 'Mes cours',
  '/mes-cours/[id]': 'Leçons d’un cours',
  '/club': 'Club',
  '/messages': 'Messages',
  '/direct': 'Cours en direct',
  '/evaluations': 'Évaluations',
  '/cgu': 'Conditions d’utilisation',
  '/confidentialite': 'Confidentialité',
}

function Carte({ titre, valeur, detail }: { titre: string; valeur: number | string; detail?: string }) {
  return (
    <div className="rounded border p-4">
      <p className="text-sm text-gray-500">{titre}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valeur}</p>
      {detail && <p className="mt-1 text-sm text-gray-500">{detail}</p>}
    </div>
  )
}

export default function Visites() {
  const [s, setS] = useState<Stats | null>(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    async function charger() {
      const { data, error } = await supabase.rpc('prof_visites_stats')
      if (annule) return
      if (error) setErreur(error.message)
      else setS(data as Stats)
    }
    charger()
    return () => {
      annule = true
    }
  }, [])

  if (erreur)
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
        {erreur}
      </p>
    )
  if (!s) return <p role="status">Chargement...</p>

  const max = Math.max(1, ...s.par_jour.map((j) => j.visites))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Visites du site</h1>
        <p className="mt-1 text-sm text-gray-600">
          Une visite = une personne qui ouvre le site (un onglet). Les chiffres sont anonymes : on ne voit ni nom ni email. Tes
          propres visites ne sont pas comptées.
        </p>
      </div>

      <section aria-labelledby="v-chiffres" className="flex flex-col gap-4">
        <h2 id="v-chiffres" className="text-xl font-bold">En chiffres</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Carte titre="Aujourd’hui" valeur={s.aujourdhui.visites} detail={`${s.aujourdhui.pages} pages vues`} />
          <Carte titre="7 derniers jours" valeur={s.sept_jours.visites} detail={`${s.sept_jours.pages} pages vues`} />
          <Carte titre="30 derniers jours" valeur={s.trente_jours.visites} detail={`${s.trente_jours.pages} pages vues`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Carte titre="Visiteurs connectés (30 jours)" valeur={s.trente_jours.connectes} detail="Élèves inscrits venus sur le site" />
          <Carte titre="Visiteurs non connectés (30 jours)" valeur={s.trente_jours.anonymes} detail="Pas encore inscrits, ou non connectés" />
        </div>
      </section>

      <section aria-labelledby="v-jours" className="flex flex-col gap-3">
        <h2 id="v-jours" className="text-xl font-bold">Les 14 derniers jours</h2>
        <ul className="flex flex-col gap-1">
          {s.par_jour.map((j) => (
            <li key={j.jour} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-gray-600">
                {new Date(j.jour + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="h-4 rounded bg-brand" style={{ width: `${(j.visites / max) * 100}%`, minWidth: j.visites ? '4px' : 0 }} aria-hidden="true" />
              <span className="tabular-nums font-medium">{j.visites}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="v-pages" className="flex flex-col gap-3">
        <h2 id="v-pages" className="text-xl font-bold">Pages les plus vues (30 jours)</h2>
        {s.top_pages.length === 0 ? (
          <p className="text-gray-500">Aucune visite enregistrée pour l’instant.</p>
        ) : (
          <ol className="list-decimal pl-5">
            {s.top_pages.map((p) => (
              <li key={p.chemin}>
                {NOMS_PAGES[p.chemin] || p.chemin} : <strong>{p.vues}</strong> vue{p.vues > 1 ? 's' : ''}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
