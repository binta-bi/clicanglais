'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [connecte, setConnecte] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setConnecte(!!data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setConnecte(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <header className="border-b">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#2d3a6b]">
          Clic<span className="text-[#e8652d]">Anglais</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/cours">Cours</Link>
          {connecte ? (
            <button onClick={() => supabase.auth.signOut()}>Déconnexion</button>
          ) : (
            <>
              <Link href="/connexion">Connexion</Link>
              <Link
                href="/inscription"
                className="bg-[#2d3a6b] text-white px-3 py-1 rounded"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}