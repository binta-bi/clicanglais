'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function verifier() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion')
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (data?.role !== 'professeur') {
        router.push('/')
        return
      }
      setOk(true)
    }
    verifier()
  }, [router])

  if (!ok) return <p className="text-center mt-10">Vérification...</p>
  return (
    <div className="max-w-5xl mx-auto px-4 mt-6">
      <nav aria-label="Espace professeur" className="mb-6 flex gap-4 border-b pb-3 font-medium">
        <Link href="/admin">Accueil</Link>
        <Link href="/admin/cours">Cours</Link>
        <Link href="/admin/avis">Avis</Link>
      </nav>
      {children}
    </div>
  )
}
