'use client'
import LienMenu from '@/components/LienMenu'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Lien « Paiements » avec le nombre de paiements à valider
export default function LienPaiements({ href, className }: { href: string; className?: string }) {
  const [nb, setNb] = useState(0)

  useEffect(() => {
    let annule = false
    async function compter() {
      const { data, error } = await supabase.rpc('prof_nb_paiements')
      if (!annule && !error && typeof data === 'number') setNb(data)
    }
    compter()
    const t = setInterval(compter, 30000)
    return () => {
      annule = true
      clearInterval(t)
    }
  }, [])

  return (
    <LienMenu href={href} className={`inline-flex items-center whitespace-nowrap ${className ?? ''}`}>
      Paiements
      {nb > 0 && (
        <span
          aria-label={`${nb} paiement${nb > 1 ? 's' : ''} à valider`}
          className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white"
        >
          {nb}
        </span>
      )}
    </LienMenu>
  )
}
