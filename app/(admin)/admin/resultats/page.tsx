'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Resultat = {
  type: 'test' | 'evaluation'
  code: string
  titre: string
  student_id: string
  nom: string
  email: string
  score: number
  total: number
  statut: string
  date: string
}

const STATUTS: Record<string, string> = {
  reussi: 'Réussi',
  echoue: 'Échoué',
  termine: 'Terminé',
  expire: 'Temps dépassé',
  abandon: 'Abandon',
}
const NOMS_SEUILS = ['Passable', 'Assez bien', 'Bien', 'Très bien']

const pct = (r: { score: number; total: number }) => (r.total > 0 ? Math.round((r.score / r.total) * 100) : 0)
const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

// Mention selon les seuils réglés par le professeur (en %)
function mention(p: number, s: number[]) {
  if (p >= s[3]) return 'Très bien'
  if (p >= s[2]) return 'Bien'
  if (p >= s[1]) return 'Assez bien'
  if (p >= s[0]) return 'Passable'
  return 'Insuffisant'
}

function telecharger(nom: string, lignes: (string | number)[][]) {
  const champ = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const contenu = '﻿' + lignes.map((l) => l.map(champ).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${nom}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Resultats() {
  const [lignes, setLignes] = useState<Resultat[]>([])
  const [seuils, setSeuils] = useState<number[]>([50, 60, 70, 80])
  const [saisie, setSaisie] = useState<string[]>(['50', '60', '70', '80'])
  const [vue, setVue] = useState<'epreuve' | 'eleve'>('epreuve')
  const [type, setType] = useState<'tout' | 'test' | 'evaluation'>('tout')
  const [epreuve, setEpreuve] = useState('')
  const [recherche, setRecherche] = useState('')
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')
  const [pret, setPret] = useState(false)

  useEffect(() => {
    let annule = false
    async function charger() {
      const [{ data, error }, { data: s }] = await Promise.all([supabase.rpc('prof_resultats'), supabase.rpc('prof_get_seuils')])
      if (annule) return
      if (error) setErreur(error.message)
      setLignes((data as Resultat[]) || [])
      const v = typeof s === 'string' ? s.split(',').map(Number) : []
      if (v.length === 4 && v.every((n) => Number.isFinite(n))) {
        setSeuils(v)
        setSaisie(v.map(String))
      }
      setPret(true)
    }
    charger()
    return () => {
      annule = true
    }
  }, [])

  const epreuves = useMemo(() => {
    const m = new Map<string, string>()
    lignes.filter((l) => type === 'tout' || l.type === type).forEach((l) => m.set(`${l.type}:${l.code}`, l.titre))
    return Array.from(m, ([cle, titre]) => ({ cle, titre })).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
  }, [lignes, type])

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return lignes.filter(
      (l) =>
        (type === 'tout' || l.type === type) &&
        (!epreuve || `${l.type}:${l.code}` === epreuve) &&
        (!q || l.nom.toLowerCase().includes(q) || l.email.toLowerCase().includes(q))
    )
  }, [lignes, type, epreuve, recherche])

  const parEleve = useMemo(() => {
    const m = new Map<string, { id: string; nom: string; email: string; items: Resultat[] }>()
    filtres.forEach((l) => {
      const e = m.get(l.student_id) || { id: l.student_id, nom: l.nom, email: l.email, items: [] }
      e.items.push(l)
      m.set(l.student_id, e)
    })
    return Array.from(m.values())
      .map((e) => ({ ...e, moyenne: Math.round(e.items.reduce((t, i) => t + pct(i), 0) / e.items.length) }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [filtres])

  async function enregistrerSeuils(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setInfo('')
    const v = saisie.map((x) => Number(x))
    if (v.some((n) => !Number.isInteger(n)) || !(v[0] >= 1 && v[0] < v[1] && v[1] < v[2] && v[2] < v[3] && v[3] <= 100)) {
      setErreur('Les seuils doivent être des nombres entiers croissants, entre 1 et 100.')
      return
    }
    const { error } = await supabase.rpc('prof_set_seuils', { p_seuils: v.join(',') })
    if (error) {
      setErreur(error.message)
      return
    }
    setSeuils(v)
    setInfo('Seuils enregistrés.')
  }

  function exporter() {
    if (vue === 'epreuve') {
      telecharger('resultats', [
        ['Nom', 'Email', 'Épreuve', 'Note', 'Total', 'Pourcentage', 'Mention', 'Statut', 'Date'],
        ...filtres.map((l) => [l.nom, l.email, l.titre, l.score, l.total, pct(l), mention(pct(l), seuils), STATUTS[l.statut] || l.statut, date(l.date)]),
      ])
    } else {
      telecharger('resultats-par-eleve', [
        ['Nom', 'Email', 'Nombre d’épreuves', 'Moyenne (%)', 'Mention', 'Détail'],
        ...parEleve.map((e) => [e.nom, e.email, e.items.length, e.moyenne, mention(e.moyenne, seuils), e.items.map((i) => `${i.titre} : ${i.score}/${i.total}`).join(' | ')]),
      ])
    }
  }

  const sel = 'rounded border p-2'
  const th = 'px-3 py-2 font-medium'

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Résultats</h1>
      <p className="text-sm text-gray-600">
        Notes des tests de niveau et des évaluations, avec la mention calculée selon tes seuils.
      </p>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      {info && (
        <p role="status" className="rounded-xl bg-green-50 p-3 font-medium text-green-800">
          {info}
        </p>
      )}

      {!pret ? (
        <p role="status">Chargement...</p>
      ) : (
        <>
          <details className="rounded border p-3">
            <summary className="cursor-pointer font-medium">
              Régler les mentions (actuellement : {seuils.map((s, i) => `${NOMS_SEUILS[i]} dès ${s} %`).join(', ')})
            </summary>
            <form onSubmit={enregistrerSeuils} className="mt-3 flex flex-wrap items-end gap-3">
              {NOMS_SEUILS.map((n, i) => (
                <label key={n} className="flex flex-col gap-1 text-sm">
                  {n} (dès, en %)
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={saisie[i]}
                    onChange={(e) => setSaisie((s) => s.map((v, j) => (j === i ? e.target.value : v)))}
                    className={`${sel} w-24`}
                  />
                </label>
              ))}
              <button type="submit" className="rounded bg-[#2d3a6b] px-4 py-2 text-white">
                Enregistrer
              </button>
            </form>
            <p className="mt-2 text-sm text-gray-600">En dessous du premier seuil, la mention est « Insuffisant ».</p>
          </details>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Affichage
              <select value={vue} onChange={(e) => setVue(e.target.value as 'epreuve' | 'eleve')} className={sel}>
                <option value="epreuve">Une ligne par épreuve</option>
                <option value="eleve">Une ligne par élève (moyenne)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Type
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as 'tout' | 'test' | 'evaluation')
                  setEpreuve('')
                }}
                className={sel}
              >
                <option value="tout">Tests et évaluations</option>
                <option value="test">Tests de niveau</option>
                <option value="evaluation">Évaluations</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Épreuve
              <select value={epreuve} onChange={(e) => setEpreuve(e.target.value)} className={`${sel} max-w-xs`}>
                <option value="">Toutes</option>
                {epreuves.map((x) => (
                  <option key={x.cle} value={x.cle}>
                    {x.titre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Rechercher (nom ou email)
              <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} className={`${sel} w-56`} />
            </label>
            <button type="button" onClick={exporter} disabled={filtres.length === 0} className="rounded border px-3 py-2 text-sm disabled:opacity-50">
              Exporter en Excel (CSV)
            </button>
          </div>

          <p className="text-sm text-gray-600" aria-live="polite">
            {vue === 'epreuve'
              ? `${filtres.length} résultat${filtres.length > 1 ? 's' : ''}`
              : `${parEleve.length} élève${parEleve.length > 1 ? 's' : ''}`}
          </p>

          {filtres.length === 0 ? (
            <p className="text-gray-500">Aucun résultat pour l’instant.</p>
          ) : vue === 'epreuve' ? (
            <div className="overflow-x-auto rounded border">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th scope="col" className={th}>Nom</th>
                    <th scope="col" className={th}>Email</th>
                    <th scope="col" className={th}>Épreuve</th>
                    <th scope="col" className={th}>Note</th>
                    <th scope="col" className={th}>%</th>
                    <th scope="col" className={th}>Mention</th>
                    <th scope="col" className={th}>Statut</th>
                    <th scope="col" className={th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.map((l) => (
                    <tr key={`${l.type}-${l.code}-${l.student_id}`} className="border-t">
                      <th scope="row" className="px-3 py-2 font-medium">{l.nom}</th>
                      <td className="break-all px-3 py-2">{l.email}</td>
                      <td className="px-3 py-2">{l.titre}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{l.score} / {l.total}</td>
                      <td className="px-3 py-2 tabular-nums">{pct(l)} %</td>
                      <td className="px-3 py-2 font-medium">{mention(pct(l), seuils)}</td>
                      <td className="px-3 py-2">{STATUTS[l.statut] || l.statut}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{date(l.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th scope="col" className={th}>Nom</th>
                    <th scope="col" className={th}>Email</th>
                    <th scope="col" className={th}>Épreuves</th>
                    <th scope="col" className={th}>Moyenne</th>
                    <th scope="col" className={th}>Mention</th>
                    <th scope="col" className={th}>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {parEleve.map((e) => (
                    <tr key={e.id} className="border-t align-top">
                      <th scope="row" className="px-3 py-2 font-medium">{e.nom}</th>
                      <td className="break-all px-3 py-2">{e.email}</td>
                      <td className="px-3 py-2 tabular-nums">{e.items.length}</td>
                      <td className="px-3 py-2 tabular-nums">{e.moyenne} %</td>
                      <td className="px-3 py-2 font-medium">{mention(e.moyenne, seuils)}</td>
                      <td className="px-3 py-2">
                        <ul className="flex flex-col gap-0.5">
                          {e.items.map((i) => (
                            <li key={`${i.type}-${i.code}`}>
                              {i.titre} : <span className="tabular-nums">{i.score}/{i.total}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
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
