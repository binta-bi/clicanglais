'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Paiement = {
  id: string
  eleve: string
  email: string | null
  tel: string | null
  achat: string
  montant: number
  reference: string
  declare_le: string
  status: 'en_attente' | 'paye' | 'echoue'
  motif_refus: string | null
  traite_le: string | null
}

type CoursMois = { id: string; title: string; niveau: string; mois: number }

const ORDRE: Record<string, number> = { debutant: 0, intermediaire: 1, avance: 2 }
const NIVEAUX = [
  { slug: 'debutant', nom: 'Débutant' },
  { slug: 'intermediaire', nom: 'Intermédiaire' },
  { slug: 'avance', nom: 'Avancé' },
]

const fcfa = (n: number) => `${Number(n).toLocaleString('fr-FR')} FCFA`
const quand = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

function CartePaiement({ p, onChange }: { p: Paiement; onChange: () => void }) {
  const [refus, setRefus] = useState(false)
  const [motif, setMotif] = useState('Paiement non retrouvé dans Wave.')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function valider() {
    if (
      !confirm(
        `Valider ce paiement ?\n\n${p.eleve} : ${p.achat}\nMontant : ${fcfa(p.montant)}\nN° de transaction : ${p.reference}\n\nAs-tu bien vu ce paiement dans Wave Business ?`,
      )
    )
      return
    setErreur('')
    setEnvoi(true)
    const { error } = await supabase.rpc('prof_valider_paiement', { p_order: p.id })
    setEnvoi(false)
    if (error) setErreur(error.message)
    else onChange()
  }

  async function refuser() {
    setErreur('')
    setEnvoi(true)
    const { error } = await supabase.rpc('prof_refuser_paiement', { p_order: p.id, p_motif: motif })
    setEnvoi(false)
    if (error) setErreur(error.message)
    else onChange()
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border-2 border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold">{p.eleve}</p>
        <p className="text-sm text-gray-500">{quand(p.declare_le)}</p>
      </div>
      {p.email && <p className="text-sm break-all text-gray-600">{p.email}</p>}
      <p className="text-lg font-medium">{p.achat}</p>
      <p className="text-2xl font-extrabold tabular-nums">{fcfa(p.montant)}</p>
      <p className="text-sm">
        N° de transaction : <strong className="font-mono break-all">{p.reference}</strong>
        {p.tel && (
          <>
            {' '}
            · Payé depuis : <a href={`tel:${p.tel}`} className="underline">{p.tel}</a>
          </>
        )}
      </p>

      {p.status === 'en_attente' && (
        <>
          <p className="rounded-xl bg-mist p-3 text-sm">
            Dans Wave Business, ouvre <strong>Transactions</strong> et cherche ce numéro. Valide seulement si tu vois un
            paiement de <strong>{fcfa(p.montant)}</strong>.
          </p>
          {refus ? (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Motif du refus (l&apos;élève le verra)
                <input
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="rounded-xl border-2 border-line px-3 py-2 font-normal"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={refuser} disabled={envoi} className="rounded-xl bg-red-700 px-4 py-2 font-bold text-white disabled:opacity-50">
                  {envoi ? 'Envoi...' : 'Confirmer le refus'}
                </button>
                <button onClick={() => setRefus(false)} className="rounded-xl border-2 border-line px-4 py-2 font-bold">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={valider} disabled={envoi} className="btn-primary disabled:opacity-50">
                {envoi ? 'Validation...' : 'Valider'}
              </button>
              <button
                onClick={() => setRefus(true)}
                className="rounded-xl border-2 border-red-700 px-6 py-3 font-bold text-red-700"
              >
                Refuser
              </button>
            </div>
          )}
        </>
      )}
      {p.status === 'paye' && <p className="font-bold text-green-700">✓ Validé{p.traite_le ? ` le ${quand(p.traite_le)}` : ''}</p>}
      {p.status === 'echoue' && (
        <p className="font-bold text-red-700">
          Refusé{p.traite_le ? ` le ${quand(p.traite_le)}` : ''}
          {p.motif_refus ? ` : ${p.motif_refus}` : ''}
        </p>
      )}
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
    </li>
  )
}

function DonnerAcces({ cours, onFini }: { cours: CoursMois[]; onFini: () => void }) {
  const [email, setEmail] = useState('')
  const [type, setType] = useState<'mois' | 'niveau'>('mois')
  const [coursId, setCoursId] = useState('')
  const [niveau, setNiveau] = useState('debutant')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')

  async function donner(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setMessage('')
    if (type === 'mois' && !coursId) {
      setErreur('Choisis un cours.')
      return
    }
    if (!confirm(`Donner cet accès à ${email} ?`)) return
    setEnvoi(true)
    const { data, error } = await supabase.rpc('prof_donner_acces', {
      p_email: email,
      p_course: type === 'mois' ? coursId : null,
      p_niveau: type === 'niveau' ? niveau : null,
    })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    setMessage(String(data))
    setEmail('')
    onFini()
  }

  return (
    <form onSubmit={donner} className="flex max-w-xl flex-col gap-3 rounded-2xl border-2 border-line p-4">
      <p className="text-sm">
        Pour un élève qui a déjà payé en dehors du site. Il doit d&apos;abord avoir créé son compte avec cet email.
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email de l&apos;élève
        <input
          type="email" value={email} required onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border-2 border-line px-3 py-2 font-normal"
        />
      </label>
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="mb-1 font-medium">Type d&apos;accès</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="type" checked={type === 'mois'} onChange={() => setType('mois')} /> Un mois
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="type" checked={type === 'niveau'} onChange={() => setType('niveau')} /> Niveau complet
        </label>
      </fieldset>
      {type === 'mois' ? (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Cours
          <select
            value={coursId} onChange={(e) => setCoursId(e.target.value)}
            className="rounded-xl border-2 border-line px-3 py-2 font-normal"
          >
            <option value="">— Choisir —</option>
            {cours.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Niveau
          <select
            value={niveau} onChange={(e) => setNiveau(e.target.value)}
            className="rounded-xl border-2 border-line px-3 py-2 font-normal"
          >
            {NIVEAUX.map((n) => (
              <option key={n.slug} value={n.slug}>{n.nom}</option>
            ))}
          </select>
        </label>
      )}
      {erreur && <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">{erreur}</p>}
      {message && <p role="status" className="rounded-xl bg-mist p-3 font-medium">{message}</p>}
      <button type="submit" disabled={envoi} className="btn-primary self-start disabled:opacity-50">
        {envoi ? 'Envoi...' : 'Donner l’accès'}
      </button>
    </form>
  )
}

export default function PagePaiements() {
  const [liste, setListe] = useState<Paiement[]>([])
  const [cours, setCours] = useState<CoursMois[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc('prof_paiements')
    if (error) setErreur(error.message)
    else {
      setErreur('')
      setListe((data as Paiement[]) || [])
    }
    const { data: c } = await supabase
      .from('courses')
      .select('id, title, niveau, mois')
      .not('mois', 'is', null)
    setCours(
      ((c as CoursMois[]) || []).sort(
        (x, y) => (ORDRE[x.niveau] ?? 9) - (ORDRE[y.niveau] ?? 9) || x.mois - y.mois,
      ),
    )
    setChargement(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  if (chargement) return <p role="status">Chargement...</p>

  const attente = liste.filter((p) => p.status === 'en_attente')
  const traites = liste.filter((p) => p.status !== 'en_attente')

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Paiements</h1>

      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}

      <section aria-labelledby="pa-attente" className="flex flex-col gap-4">
        <h2 id="pa-attente" className="text-xl font-bold">
          À valider ({attente.length})
        </h2>
        {attente.length === 0 ? (
          <p className="text-gray-500">Aucun paiement en attente.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {attente.map((p) => (
              <CartePaiement key={p.id} p={p} onChange={charger} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pa-acces" className="flex flex-col gap-4">
        <h2 id="pa-acces" className="text-xl font-bold">
          Donner un accès directement
        </h2>
        <DonnerAcces cours={cours} onFini={charger} />
      </section>

      <section aria-labelledby="pa-traites" className="flex flex-col gap-4">
        <h2 id="pa-traites" className="text-xl font-bold">
          Déjà traités
        </h2>
        {traites.length === 0 ? (
          <p className="text-gray-500">Rien pour l&apos;instant.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {traites.map((p) => (
              <CartePaiement key={p.id} p={p} onChange={charger} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
