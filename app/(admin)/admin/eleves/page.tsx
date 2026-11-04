'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Eleve = {
  id: string
  nom: string
  email: string
  niveau: string | null
  inscrit_le: string
  derniere_connexion: string | null
  nb_achats: number
}

const NIVEAUX: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
const nomNiveau = (n: string | null) => (n ? NIVEAUX[n] || n : 'Pas encore')
const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Jamais'

function csv(eleves: Eleve[]) {
  const champ = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const lignes = [
    ['Nom', 'Email', 'Niveau', 'Inscrit le', 'Dernière connexion', 'Cours achetés'].map(champ).join(';'),
    ...eleves.map((e) =>
      [e.nom, e.email, nomNiveau(e.niveau), date(e.inscrit_le), date(e.derniere_connexion), e.nb_achats].map(champ).join(';')
    ),
  ]
  // BOM + point-virgule : Excel en français ouvre le fichier correctement
  return '﻿' + lignes.join('\r\n')
}

export default function Eleves() {
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [recherche, setRecherche] = useState('')
  const [erreur, setErreur] = useState('')
  const [pret, setPret] = useState(false)

  useEffect(() => {
    let annule = false
    async function charger() {
      const { data, error } = await supabase.rpc('prof_eleves')
      if (annule) return
      if (error) setErreur(error.message)
      setEleves((data as Eleve[]) || [])
      setPret(true)
    }
    charger()
    return () => {
      annule = true
    }
  }, [])

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return eleves
    return eleves.filter((e) => e.nom.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
  }, [eleves, recherche])

  function exporter() {
    const blob = new Blob([csv(filtres)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eleves-clicanglais-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Élèves inscrits</h1>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      {!pret ? (
        <p role="status">Chargement...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Rechercher (nom ou email)
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-72 max-w-full rounded border p-2"
              />
            </label>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600" aria-live="polite">
                {filtres.length} élève{filtres.length > 1 ? 's' : ''}
                {recherche.trim() ? ` sur ${eleves.length}` : ''}
              </p>
              <button
                type="button"
                onClick={exporter}
                disabled={filtres.length === 0}
                className="rounded border px-3 py-2 text-sm disabled:opacity-50"
              >
                Exporter en Excel (CSV)
              </button>
            </div>
          </div>

          {filtres.length === 0 ? (
            <p className="text-gray-500">{eleves.length === 0 ? 'Aucun élève inscrit pour l’instant.' : 'Aucun résultat.'}</p>
          ) : (
            <div className="overflow-x-auto rounded border">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Nom</th>
                    <th scope="col" className="px-3 py-2 font-medium">Email</th>
                    <th scope="col" className="px-3 py-2 font-medium">Niveau</th>
                    <th scope="col" className="px-3 py-2 font-medium">Inscrit le</th>
                    <th scope="col" className="px-3 py-2 font-medium">Dernière connexion</th>
                    <th scope="col" className="px-3 py-2 font-medium">Cours achetés</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.map((e) => (
                    <tr key={e.id} className="border-t">
                      <th scope="row" className="px-3 py-2 font-medium">{e.nom}</th>
                      <td className="break-all px-3 py-2">{e.email}</td>
                      <td className="px-3 py-2">{nomNiveau(e.niveau)}</td>
                      <td className="px-3 py-2">{date(e.inscrit_le)}</td>
                      <td className="px-3 py-2">{date(e.derniere_connexion)}</td>
                      <td className="px-3 py-2 tabular-nums">{e.nb_achats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
