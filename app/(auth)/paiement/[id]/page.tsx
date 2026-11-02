'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'
import { demarrerPaiementWave, verifierPaiementWave } from '@/lib/wave-client'
import { lienWave, WAVE_NOM_COMPTE } from '@/lib/wave-config'
import { WHATSAPP_PROF } from '@/lib/contact'

type Commande = {
  id: string
  kind: 'mois' | 'niveau'
  niveau: NiveauSlug | null
  amount: number
  status: 'en_attente' | 'paye' | 'echoue'
  provider: string
  provider_ref: string | null
  declare_le: string | null
  motif_refus: string | null
  courses: { title: string } | null
}

type Mode = 'simule' | 'manuel' | 'wave'

function fcfa(n: number) {
  return `${Number(n).toLocaleString('fr-FR')} FCFA`
}

function Paiement() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [commande, setCommande] = useState<Commande | null>(null)
  const [mode, setMode] = useState<Mode>('wave')
  const [refTransaction, setRefTransaction] = useState('')
  const [tel, setTel] = useState('')
  const [pret, setPret] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [verification, setVerification] = useState(false)

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
        .select('id, kind, niveau, amount, status, provider, provider_ref, declare_le, motif_refus, courses(title)')
        .eq('id', id)
        .maybeSingle()
      const { data: m } = await supabase.rpc('mode_paiement')
      let mode: Mode = m === 'simule' || m === 'manuel' || m === 'wave' ? m : 'wave'
      if (typeof m !== 'string') {
        // ancienne base sans le mode « manuel » : on retombe sur le comportement d'avant
        const { data: actif } = await supabase.rpc('paiement_simule_actif')
        mode = actif === true ? 'simule' : 'wave'
      }
      if (annule) return
      const cmd = (data as unknown as Commande) ?? null
      setCommande(cmd)
      setMode(mode)
      setPret(true)

      // Retour depuis Wave : on demande à Wave si le paiement est bien passé
      // (quelques essais, car la confirmation peut prendre quelques secondes).
      if (cmd && cmd.status === 'en_attente' && cmd.provider === 'wave') {
        const retour = new URLSearchParams(window.location.search).get('retour') === '1'
        const essais = retour ? 6 : 1
        setVerification(true)
        for (let i = 0; i < essais && !annule; i++) {
          try {
            const { status } = await verifierPaiementWave(id)
            if (annule) return
            if (status !== 'en_attente') {
              setCommande((c) => (c ? { ...c, status } : c))
              break
            }
          } catch (e) {
            if (!annule) setErreur(e instanceof Error ? e.message : 'Erreur de vérification.')
            break
          }
          if (i < essais - 1) await new Promise((ok) => setTimeout(ok, 3000))
        }
        if (!annule) setVerification(false)
      }
    }
    charger()
    return () => {
      annule = true
    }
  }, [id, router])

  // Quand le paiement est en attente de validation, on regarde de temps en temps si le professeur a répondu
  const enAttenteDeValidation =
    commande?.status === 'en_attente' && commande.provider === 'manuel' && !!commande.declare_le
  useEffect(() => {
    if (!enAttenteDeValidation) return
    const t = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('status, motif_refus')
        .eq('id', id)
        .maybeSingle()
      if (data) setCommande((c) => (c ? { ...c, ...(data as Pick<Commande, 'status' | 'motif_refus'>) } : c))
    }, 20000)
    return () => clearInterval(t)
  }, [enAttenteDeValidation, id])

  async function actualiser() {
    setErreur('')
    setVerification(true)
    const { data, error } = await supabase
      .from('orders')
      .select('status, motif_refus')
      .eq('id', id)
      .maybeSingle()
    setVerification(false)
    if (error) setErreur(error.message)
    else if (data) setCommande((c) => (c ? { ...c, ...(data as Pick<Commande, 'status' | 'motif_refus'>) } : c))
  }

  async function declarer(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    const ref = refTransaction.replace(/\s+/g, '')
    if (!/^[A-Za-z0-9_-]{6,40}$/.test(ref)) {
      setErreur(
        'Numéro de transaction invalide. Recopie-le tel qu’il apparaît sur ton reçu Wave (lettres et chiffres, sans espaces).',
      )
      return
    }
    setEnvoi(true)
    const { error } = await supabase.rpc('declarer_paiement', { p_order: id, p_ref: ref, p_tel: tel })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    setCommande((c) => (c ? { ...c, provider: 'manuel', provider_ref: ref.toUpperCase(), declare_le: new Date().toISOString() } : c))
  }

  async function payerAvecWave() {
    setErreur('')
    setEnvoi(true)
    try {
      const { url } = await demarrerPaiementWave(id)
      window.location.href = url
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur de paiement. Réessaie.')
      setEnvoi(false)
    }
  }

  async function reverifier() {
    setErreur('')
    setVerification(true)
    try {
      const { status } = await verifierPaiementWave(id)
      setCommande((c) => (c ? { ...c, status } : c))
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur de vérification.')
    }
    setVerification(false)
  }

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

  const whatsapp = WHATSAPP_PROF.startsWith('[') ? null : WHATSAPP_PROF

  if (commande.status === 'echoue') {
    const refuse = commande.provider === 'manuel' && !!commande.declare_le
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {refuse ? 'Ton paiement n’a pas été validé' : 'Le paiement n’a pas abouti'}
        </h1>
        {refuse ? (
          <>
            {commande.motif_refus && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-lg font-medium text-red-800">
                Motif : {commande.motif_refus}
              </p>
            )}
            <p className="mt-3 text-lg">
              Si tu as bien payé, contacte le professeur avec ton reçu Wave
              {whatsapp ? ` sur WhatsApp : ${whatsapp}` : ''}. Sinon, tu peux recommencer depuis la page du cours.
            </p>
          </>
        ) : (
          <p className="mt-3 text-lg">Aucun montant n&apos;a été débité. Tu peux réessayer depuis la page du cours.</p>
        )}
        <Link href="/cours" className="btn-primary mt-6">
          Retour aux cours
        </Link>
      </div>
    )
  }

  if (enAttenteDeValidation) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Paiement en attente de validation</h1>
        <section className="mt-6 rounded-2xl bg-mist p-6">
          <p className="text-lg font-bold">{titre}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{fcfa(commande.amount)}</p>
          <p className="mt-3">
            Numéro de transaction : <strong className="font-mono">{commande.provider_ref}</strong>
          </p>
        </section>
        <p className="mt-5 text-lg">
          Le professeur vérifie ton paiement, en général en quelques heures. Tu peux fermer cette page : ton cours
          apparaîtra dans « Mes cours » dès que ton paiement sera validé.
        </p>
        {whatsapp && (
          <p className="mt-3">
            Une question ? Envoie ton reçu Wave au professeur sur WhatsApp : <strong>{whatsapp}</strong>.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={actualiser} disabled={verification} className="btn-primary disabled:opacity-50">
            {verification ? 'Vérification...' : 'Vérifier maintenant'}
          </button>
          <Link href="/mes-cours" className="btn-secondary">
            Mes cours
          </Link>
        </div>
        {erreur && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 font-medium text-red-800">
            {erreur}
          </p>
        )}
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

      {mode === 'manuel' ? (
        <section className="mt-6 flex flex-col gap-6" aria-label="Paiement avec Wave">
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-line p-6">
            <h2 className="text-xl font-bold">1. Paie {fcfa(commande.amount)} avec Wave</h2>
            <p>
              Compte : <strong>{WAVE_NOM_COMPTE}</strong>. Vérifie bien que le montant est{' '}
              <strong>{fcfa(commande.amount)}</strong>.
            </p>
            <a
              href={lienWave(commande.amount)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary self-start"
            >
              Payer {fcfa(commande.amount)} avec Wave
            </a>
            <p className="text-sm">
              Sur ordinateur, tu peux aussi scanner ce QR code avec l&apos;application Wave de ton téléphone :
            </p>
            <Image
              src="/wave-qr.png"
              alt={`QR code Wave du compte ${WAVE_NOM_COMPTE}`}
              width={451}
              height={648}
              className="h-auto w-full max-w-[16rem] rounded-xl"
            />
          </div>

          <form onSubmit={declarer} className="flex flex-col gap-4 rounded-2xl border-2 border-line p-6">
            <h2 className="text-xl font-bold">2. Envoie-nous ton numéro de transaction</h2>
            <p>
              Après le paiement, Wave t&apos;envoie un reçu (SMS ou historique de l&apos;application). Recopie son
              numéro de transaction ici.
            </p>
            <label className="flex flex-col gap-1 font-medium">
              Numéro de transaction Wave
              <input
                value={refTransaction}
                onChange={(e) => setRefTransaction(e.target.value)}
                required
                autoComplete="off"
                autoCapitalize="characters"
                className="rounded-xl border-2 border-line px-4 py-3 font-mono text-base font-normal"
              />
            </label>
            <label className="flex flex-col gap-1 font-medium">
              Numéro de téléphone avec lequel tu as payé
              <input
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                required
                autoComplete="tel"
                className="rounded-xl border-2 border-line px-4 py-3 text-base font-normal"
              />
            </label>
            <button type="submit" disabled={envoi} className="btn-primary self-start disabled:opacity-50">
              {envoi ? 'Envoi...' : 'J’ai payé : envoyer pour validation'}
            </button>
          </form>
        </section>
      ) : mode === 'simule' ? (
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
        <section className="mt-6 flex flex-col gap-4 rounded-2xl bg-mist p-6">
          {verification ? (
            <p role="status" className="font-medium">
              Vérification de ton paiement avec Wave...
            </p>
          ) : (
            <>
              <p className="font-medium">
                {commande.provider === 'wave'
                  ? "Ton paiement n'est pas encore confirmé. Si tu as déjà payé, attends quelques secondes puis vérifie."
                  : "Tu seras envoyé vers l'application Wave pour valider le paiement."}
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={payerAvecWave} disabled={envoi} className="btn-primary disabled:opacity-50">
                  {envoi ? 'Ouverture de Wave...' : 'Payer avec Wave'}
                </button>
                {commande.provider === 'wave' && (
                  <button onClick={reverifier} className="btn-secondary">
                    J&apos;ai payé : vérifier mon paiement
                  </button>
                )}
              </div>
            </>
          )}
        </section>
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
