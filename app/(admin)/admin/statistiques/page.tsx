'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Tentatives = { reussi: number; echoue: number; expire: number; en_cours: number }
type Stats = {
  inscrits: number
  inscrits_30j: number
  niveaux: { debutant: number; intermediaire: number; avance: number; sans_niveau: number }
  tests: { test1: Tentatives; test2: Tentatives }
  acheteurs: number
  achats: number
  commandes_payees: number
  encaisse_reel: number
  encaisse_simule: number
  encaisse_30j: number
  top_cours: { titre: string; achats: number }[]
  avis: number
  note_moyenne: number | null
  messages_non_lus: number
}

const fcfa = (n: number) => `${Number(n).toLocaleString('fr-FR')} FCFA`

function Carte({ titre, valeur, detail }: { titre: string; valeur: string | number; detail?: string }) {
  return (
    <div className="rounded border p-4">
      <p className="text-sm text-gray-500">{titre}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valeur}</p>
      {detail && <p className="mt-1 text-sm text-gray-500">{detail}</p>}
    </div>
  )
}

function LigneTest({ nom, t }: { nom: string; t: Tentatives }) {
  const termines = t.reussi + t.echoue + t.expire
  const taux = termines > 0 ? Math.round((t.reussi / termines) * 100) : null
  return (
    <tr className="border-t">
      <th scope="row" className="py-2 pr-3 text-left font-medium">
        {nom}
      </th>
      <td className="px-3 py-2 tabular-nums">{t.reussi}</td>
      <td className="px-3 py-2 tabular-nums">{t.echoue}</td>
      <td className="px-3 py-2 tabular-nums">{t.expire}</td>
      <td className="px-3 py-2 tabular-nums">{t.en_cours}</td>
      <td className="px-3 py-2 tabular-nums">{taux === null ? '—' : `${taux} %`}</td>
    </tr>
  )
}

export default function Statistiques() {
  const [s, setS] = useState<Stats | null>(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    async function charger() {
      const { data, error } = await supabase.rpc('admin_stats')
      if (annule) return
      if (error) setErreur(error.message)
      else setS(data as Stats)
    }
    charger()
    return () => {
      annule = true
    }
  }, [])

  if (erreur) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
        {erreur}
      </p>
    )
  }
  if (!s) return <p role="status">Chargement...</p>

  const niveaux = [
    { nom: 'Débutant', n: s.niveaux.debutant },
    { nom: 'Intermédiaire', n: s.niveaux.intermediaire },
    { nom: 'Avancé', n: s.niveaux.avance },
    { nom: 'Pas encore choisi', n: s.niveaux.sans_niveau },
  ]
  const maxNiveau = Math.max(1, ...niveaux.map((x) => x.n))

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Statistiques</h1>

      <section aria-labelledby="st-eleves" className="flex flex-col gap-4">
        <h2 id="st-eleves" className="text-xl font-bold">
          Élèves
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Carte titre="Élèves inscrits" valeur={s.inscrits} />
          <Carte titre="Nouveaux (30 derniers jours)" valeur={s.inscrits_30j} />
        </div>
        <ul className="flex flex-col gap-2">
          {niveaux.map((x) => (
            <li key={x.nom} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3">
              <span>{x.nom}</span>
              <span className="h-3 rounded bg-gray-100" aria-hidden="true">
                <span className="block h-3 rounded bg-[#2d3a6b]" style={{ width: `${(x.n / maxNiveau) * 100}%` }} />
              </span>
              <span className="text-right font-bold tabular-nums">{x.n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="st-tests" className="flex flex-col gap-4">
        <h2 id="st-tests" className="text-xl font-bold">
          Tests de niveau
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-gray-500">
              <tr>
                <th scope="col" className="pr-3 pb-2 font-normal">
                  Test
                </th>
                <th scope="col" className="px-3 pb-2 font-normal">
                  Réussis
                </th>
                <th scope="col" className="px-3 pb-2 font-normal">
                  Échoués
                </th>
                <th scope="col" className="px-3 pb-2 font-normal">
                  Temps écoulé
                </th>
                <th scope="col" className="px-3 pb-2 font-normal">
                  En cours
                </th>
                <th scope="col" className="px-3 pb-2 font-normal">
                  Taux de réussite
                </th>
              </tr>
            </thead>
            <tbody>
              <LigneTest nom="Test Intermédiaire" t={s.tests.test1} />
              <LigneTest nom="Test Avancé" t={s.tests.test2} />
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="st-achats" className="flex flex-col gap-4">
        <h2 id="st-achats" className="text-xl font-bold">
          Achats
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Carte titre="Élèves qui ont acheté" valeur={s.acheteurs} detail={`${s.achats} cours achetés au total`} />
          <Carte titre="Argent encaissé" valeur={fcfa(s.encaisse_reel)} detail={`dont ${fcfa(s.encaisse_30j)} sur 30 jours`} />
          <Carte
            titre="Paiements de test (simulés)"
            valeur={fcfa(s.encaisse_simule)}
            detail="Ce montant n'est pas de l'argent réel."
          />
        </div>
        <div>
          <h3 className="mb-2 font-bold">Cours les plus achetés</h3>
          {s.top_cours.length === 0 ? (
            <p className="text-gray-500">Aucun achat pour l&apos;instant.</p>
          ) : (
            <ol className="list-decimal pl-5">
              {s.top_cours.map((c) => (
                <li key={c.titre}>
                  {c.titre} : <strong>{c.achats}</strong> achat{c.achats > 1 ? 's' : ''}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section aria-labelledby="st-echanges" className="flex flex-col gap-4">
        <h2 id="st-echanges" className="text-xl font-bold">
          Avis et messages
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Carte titre="Avis publiés" valeur={s.avis} />
          <Carte
            titre="Note moyenne"
            valeur={s.note_moyenne === null ? '—' : `${String(s.note_moyenne).replace('.', ',')} / 5`}
          />
          <Carte titre="Messages non lus" valeur={s.messages_non_lus} />
        </div>
      </section>
    </div>
  )
}
