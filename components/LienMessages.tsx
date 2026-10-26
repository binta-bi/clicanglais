'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Lien « Messages » avec le nombre de messages non lus
export default function LienMessages({ href, className }: { href: string; className?: string }) {
  const [non, setNon] = useState(0)

  useEffect(() => {
    let annule = false
    async function compter() {
      const { data, error } = await supabase.rpc('unread_count')
      if (!annule && !error && typeof data === 'number') setNon(data)
    }
    compter()
    const t = setInterval(compter, 30000)
    return () => {
      annule = true
      clearInterval(t)
    }
  }, [])

  return (
    <Link href={href} className={`inline-flex items-center whitespace-nowrap ${className ?? ""}`}>
      Messages
      {non > 0 && (
        <span
          aria-label={`${non} message${non > 1 ? 's' : ''} non lu${non > 1 ? 's' : ''}`}
          className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white"
        >
          {non}
        </span>
      )}
    </Link>
  )
}
