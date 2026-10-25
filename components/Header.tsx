'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [connecte, setConnecte] = useState(false)
  const [estProf, setEstProf] = useState(false)

  async function chargerRole(userId: string | undefined) {
    if (!userId) {
      setEstProf(false)
      return
    }
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setEstProf(data?.role === 'professeur')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setConnecte(!!data.user)
      chargerRole(data.user?.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setConnecte(!!session)
      setTimeout(() => chargerRole(session?.user?.id), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-navy">
          Clic<span className="text-brand">Anglais</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/cours">Cours</Link>
          {connecte && <Link href="/mes-cours">Mes cours</Link>}
          {connecte && <Link href="/direct">Direct</Link>}
          {estProf && (
            <Link href="/admin" className="font-bold text-brand-deep">
              Espace professeur
            </Link>
          )}
          {connecte ? (
            <button onClick={() => supabase.auth.signOut()}>Déconnexion</button>
          ) : (
            <>
              <Link href="/connexion">Connexion</Link>
              <Link href="/inscription" className="rounded-lg bg-navy px-3 py-1.5 text-white">
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
