'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Etat = 'chargement' | 'visiteur' | 'sans-achat' | 'achete'

export default function AccesCours({ courseId, prix }: { courseId: string; prix: number }) {
  const [etat, setEtat] = useState<Etat>('chargement')

  useEffect(() => {
    let annule = false
    async function verifier() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!annule) setEtat('visiteur')
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

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-mist p-5">
      <p className="font-medium">
        Les vidéos de ce cours sont réservées aux élèves qui l&apos;ont acheté.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-2xl font-bold">{prix.toLocaleString('fr-FR')} FCFA</p>
        <button disabled className="btn-primary opacity-60">
          Acheter (bientôt)
        </button>
      </div>
      {etat === 'visiteur' && (
        <p className="text-sm">
          <Link href="/inscription" className="font-bold underline">
            Crée un compte
          </Link>{' '}
          ou{' '}
          <Link href="/connexion" className="font-bold underline">
            connecte-toi
          </Link>{' '}
          pour acheter.
        </p>
      )}
    </div>
  )
}
