'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LienMessages from '@/components/LienMessages'
import LienPaiements from '@/components/LienPaiements'
import LienMenu from '@/components/LienMenu'

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
    <div className="hero-ivoire min-h-[calc(100dvh-4.2rem)]">
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Espace professeur" className="admin-nav mb-8">
        <LienMenu href="/admin">Accueil</LienMenu>
        <LienPaiements href="/admin/paiements" />
        <LienMenu href="/admin/statistiques">Statistiques</LienMenu>
        <LienMenu href="/admin/eleves">Élèves</LienMenu>
        <LienMenu href="/admin/visites">Visites</LienMenu>
        <LienMenu href="/admin/cours">Cours</LienMenu>
        <LienMenu href="/admin/tests">Tests</LienMenu>
        <LienMenu href="/admin/evaluations">Évaluations</LienMenu>
        <LienMenu href="/admin/resultats">Résultats</LienMenu>
        <LienMenu href="/admin/direct">Direct</LienMenu>
        <LienMenu href="/club">Club</LienMenu>
        <LienMenu href="/admin/avis">Avis</LienMenu>
        <LienMessages href="/admin/messages" />
      </nav>
      {children}
    </div>
    </div>
  )
}
