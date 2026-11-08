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
    <div className="max-w-5xl mx-auto px-4 mt-6">
      <nav aria-label="Espace professeur" className="menu-liens mb-6 flex flex-wrap gap-x-4 gap-y-2 border-b pb-3 font-medium">
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
  )
}
