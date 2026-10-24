'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

type Commande = {
  id: string
  kind: 'mois' | 'niveau'
  niveau: NiveauSlug | null
  amount: number
  status: 'en_attente' | 'paye' | 'echoue'
  courses: { title: string } | null
}

function fcfa(n: number) {
  return `${Number(n).toLocaleString('fr-FR')} FCFA`
}

function Paiement() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [commande, setCommande] = useState<Commande | null>(null)
  const [simule, setSimule] = useState(false)
  const [pret, setPret] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/connexion')
        return
      }
      const { data } = await supabase
        .from('orders')
        .select('id, kind, niveau, amount, status, courses(title)')
        .eq('id', id)
        .maybeSingle()
      const { data: actif } = await supabase.rpc('paiement_simule_actif')
      if (annule) return
      setCommande((data as unknown as Commande) ?? null)
      setSimule(actif === true)
      setPret(true)
    }
    charger()
    return () => {
      annule = true
    }
  }, [id, router])

  async function simuler(reussi: boolean) {
    setErreur('')
    setEnvoi(true)
    const { data, error } = await supabase.rpc('simuler_paiement', { p_order: id, p_reussi: reussi })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    const statut = (data as { status: Commande['status'] }).status
    setCommande((c) => (c ? { ...c, status: statut } : c))
  }

  if (!pret) {
    return (
      <p role="status" className="mx-auto mt-16 max-w-2xl px-5 text-center text-lg">
        Chargement...
      </p>
    )
  }

  if (!commande) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="text-2xl font-bold">Commande introuvable</h1>
        <Link href="/cours" className="btn-primary mt-6">
          Voir les cours
        </Link>
      </div>
    )
  }

  const titre =
    commande.kind === 'niveau' && commande.niveau
      ? `Niveau ${NOM_NIVEAU[commande.niveau]} complet (3 mois)`
      : (commande.courses?.title ?? 'Cours')

  if (commande.status === 'paye') {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Paiement reçu, merci !</h1>
        <p className="mt-3 text-lg">
          Tu as maintenant accès à : <strong>{titre}</strong>.
        </p>
        <Link href="/mes-cours" className="btn-primary mt-6">
          Aller à mes cours
        </Link>
      </div>
    )
  }

  if (commande.status === 'echoue') {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Le paiement n&apos;a pas abouti</h1>
        <p className="mt-3 text-lg">Aucun montant n&apos;a été débité. Tu peux réessayer depuis la page du cours.</p>
        <Link href="/cours" className="btn-primary mt-6">
          Retour aux cours
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Ta commande</h1>

      <section className="mt-6 rounded-2xl bg-mist p-6">
        <p className="text-lg font-bold">{titre}</p>
        <p className="mt-2 text-3xl font-extrabold tabular-nums">{fcfa(commande.amount)}</p>
      </section>

      {simule ? (
        <section className="mt-6 flex flex-col gap-4 rounded-2xl border-2 border-dashed border-brand-dark p-6">
          <p className="font-bold">MODE TEST : aucun argent réel n&apos;est débité.</p>
          <p>Cette page remplace le paiement réel pendant la phase de test.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => simuler(true)} disabled={envoi} className="btn-primary disabled:opacity-50">
              Simuler un paiement réussi
            </button>
            <button onClick={() => simuler(false)} disabled={envoi} className="btn-secondary disabled:opacity-50">
              Simuler un échec
            </button>
          </div>
        </section>
      ) : (
        <p className="mt-6 rounded-2xl bg-mist p-5 font-medium">
          Le paiement en ligne sera bientôt disponible. Reviens dans quelques jours.
        </p>
      )}

      {erreur && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
    </div>
  )
}

// useParams() doit être lu sous <Suspense> pour que le site se compile en production
export default function PagePaiement() {
  return (
    <Suspense
      fallback={
        <p role="status" className="mx-auto mt-16 max-w-2xl px-5 text-center text-lg">
          Chargement...
        </p>
      }
    >
      <Paiement />
    </Suspense>
  )
}
