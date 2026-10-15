'use client'
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
      const { data, error } = await supabase
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
  return <div className="max-w-5xl mx-auto px-4 mt-6">{children}</div>
}