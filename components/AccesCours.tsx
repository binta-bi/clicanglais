'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

type Etat = 'chargement' | 'visiteur' | 'sans-achat' | 'achete'

function fcfa(n: number) {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

export default function AccesCours({
  courseId,
  prix,
  niveau,
  vendable,
}: {
  courseId: string
  prix: number
  niveau: NiveauSlug
  vendable: boolean
}) {
  const router = useRouter()
  const [etat, setEtat] = useState<Etat>('chargement')
  const [prixNiveau, setPrixNiveau] = useState<number | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    async function verifier() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: tarif } = await supabase.from('tarifs').select('montant').eq('code', 'niveau_complet').single()
      if (annule) return
      if (tarif) setPrixNiveau(Number(tarif.montant))
      if (!user) {
        setEtat('visiteur')
        return
      }
      // Chaque élève ne voit que ses propres achats (règle de sécurité de la base)
      const { data } = await supabase
        .from('purchases')
        .select('id')
        .eq('course_id', courseId)
        .eq('status', 'valide')
        .limit(1)
      if (!annule) setEtat(data && data.length > 0 ? 'achete' : 'sans-achat')
    }
    verifier()
    return () => {
      annule = true
    }
  }, [courseId])

  async function acheter(type: 'mois' | 'niveau') {
    setErreur('')
    setEnCours(true)
    const { data, error } =
      type === 'mois'
        ? await supabase.rpc('create_order', { p_kind: 'mois', p_course: courseId })
        : await supabase.rpc('create_order', { p_kind: 'niveau', p_niveau: niveau })
    if (error) {
      setErreur(error.message)
      setEnCours(false)
      return
    }
    router.push(`/paiement/${(data as { order_id: string }).order_id}`)
  }

  if (etat === 'chargement') return <div className="h-24" aria-hidden="true" />

  if (etat === 'achete') {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-mist p-5">
        <p className="font-medium">Tu as acheté ce cours.</p>
        <Link href={`/mes-cours/${courseId}`} className="btn-primary">
          Accéder aux leçons
        </Link>
      </div>
    )
  }

  if (!vendable) {
    return (
      <div className="rounded-2xl bg-mist p-5">
        <p className="font-medium">Ce cours n&apos;est pas encore disponible à l&apos;achat.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-mist p-5">
      <p className="font-medium">Les vidéos de ce cours sont réservées aux élèves qui l&apos;ont acheté.</p>

      {etat === 'visiteur' ? (
        <>
          <p className="text-2xl font-bold">{fcfa(prix)}</p>
          <p>
            <Link href="/inscription" className="font-bold underline">
              Crée un compte
            </Link>{' '}
            ou{' '}
            <Link href="/connexion" className="font-bold underline">
              connecte-toi
            </Link>{' '}
            pour acheter.
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-2xl font-bold">{fcfa(prix)}</p>
            <button onClick={() => acheter('mois')} disabled={enCours} className="btn-primary disabled:opacity-50">
              {enCours ? 'Un instant...' : 'Acheter ce mois'}
            </button>
          </div>
          {prixNiveau !== null && (
            <div className="flex flex-wrap items-center gap-4 border-t border-line pt-3">
              <p>
                <strong>Niveau {NOM_NIVEAU[niveau]} complet</strong> : les 3 mois pour {fcfa(prixNiveau)}
              </p>
              <button onClick={() => acheter('niveau')} disabled={enCours} className="btn-secondary disabled:opacity-50">
                Prendre le niveau complet
              </button>
            </div>
          )}
        </div>
      )}

      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
    </div>
  )
}
