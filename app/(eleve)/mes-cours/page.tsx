'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'
import { verifierPaiementWave } from '@/lib/wave-client'

type Achat = {
  id: string
  courses: { id: string; title: string; niveau: string; mois: number | null } | null
}

type Attente = { id: string; kind: string; niveau: string | null; amount: number; courses: { title: string } | null }

const ORDRE: Record<string, number> = { debutant: 0, intermediaire: 1, avance: 2 }

export default function MesCours() {
  const [achats, setAchats] = useState<Achat[]>([])
  const [attente, setAttente] = useState<Attente[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion')
        return
      }
      // Rattrapage : un paiement Wave fait mais pas encore confirmé (page fermée trop tôt)
      const { data: attente } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'en_attente')
        .eq('provider', 'wave')
        .order('created_at', { ascending: false })
        .limit(3)
      for (const o of (attente as { id: string }[]) || []) {
        try {
          await verifierPaiementWave(o.id)
        } catch {
          // sans gravité : l'élève pourra revérifier depuis la page de paiement
        }
      }
      // Paiements déclarés, en attente de validation par le professeur
      const { data: enAttente } = await supabase
        .from('orders')
        .select('id, kind, niveau, amount, courses(title)')
        .eq('status', 'en_attente')
        .eq('provider', 'manuel')
        .not('declare_le', 'is', null)
        .order('created_at', { ascending: false })
      setAttente((enAttente as unknown as Attente[]) || [])
      const { data } = await supabase
        .from('purchases')
        .select('id, courses(id, title, niveau, mois)')
        .eq('status', 'valide')
      const liste = ((data as unknown as Achat[]) || [])
        .filter((a) => a.courses)
        .sort((a, b) => {
          const x = a.courses!
          const y = b.courses!
          return (ORDRE[x.niveau] ?? 9) - (ORDRE[y.niveau] ?? 9) || (x.mois ?? 0) - (y.mois ?? 0)
        })
      setAchats(liste)
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 pb-16 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mes cours</h1>

      {loading && <p role="status">Chargement...</p>}

      {attente.length > 0 && (
        <div className="rounded-2xl border-2 border-brand p-5">
          <p className="font-bold">Paiement en attente de validation</p>
          <ul className="mt-2 flex flex-col gap-1">
            {attente.map((o) => (
              <li key={o.id}>
                <Link href={`/paiement/${o.id}`} className="underline">
                  {o.kind === 'niveau' && o.niveau
                    ? `Niveau ${NOM_NIVEAU[o.niveau as NiveauSlug] ?? o.niveau} complet`
                    : (o.courses?.title ?? 'Cours')}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">Le professeur vérifie ton paiement. Ton cours apparaîtra ici dès qu&apos;il sera validé.</p>
        </div>
      )}

      {!loading && achats.length === 0 && (
        <div className="rounded-2xl bg-mist p-6">
          <p className="font-medium">Tu n&apos;as acheté aucun cours pour l&apos;instant.</p>
          <p className="mt-1">
            Chaque mois de cours s&apos;achète séparément, ou tu peux prendre un niveau complet. Tes cours
            apparaîtront ici dès l&apos;achat.
          </p>
          <Link href="/cours" className="btn-primary mt-4">
            Voir les cours
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {achats.map((a) => (
          <Link
            key={a.id}
            href={`/mes-cours/${a.courses!.id}`}
            className="border rounded p-4 flex flex-col gap-1 hover:shadow"
          >
            <h2 className="font-bold">{a.courses!.title}</h2>
            <p className="text-sm text-gray-500">
              Niveau {NOM_NIVEAU[a.courses!.niveau as NiveauSlug] ?? a.courses!.niveau}
              {a.courses!.mois ? ` · Mois ${a.courses!.mois} sur 3` : ''}
            </p>
            <p className="text-sm text-[#e8652d]">Continuer →</p>
          </Link>
        ))}
      </div>

      {!loading && achats.length > 0 && (
        <Link href="/direct" className="rounded-2xl bg-mist p-5 font-medium hover:shadow">
          Cours en direct et rediffusions →
        </Link>
      )}
    </div>
  )
}
