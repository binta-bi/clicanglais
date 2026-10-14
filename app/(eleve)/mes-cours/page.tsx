'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Achat = {
  id: string
  courses: { id: string; title: string; niveau: string }
}

export default function MesCours() {
  const [achats, setAchats] = useState<Achat[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion')
        return
      }
      const { data } = await supabase
        .from('purchases')
        .select('id, courses(id, title, niveau)')
        .eq('status', 'valide')
      setAchats((data as unknown as Achat[]) || [])
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mes cours</h1>

      {loading && <p>Chargement...</p>}
      {!loading && achats.length === 0 && (
        <p>
          Tu n&apos;as pas encore de cours.{' '}
          <Link href="/cours" className="underline">Voir le catalogue</Link>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {achats.map((a) => (
          <Link
            key={a.id}
            href={`/mes-cours/${a.courses.id}`}
            className="border rounded p-4 flex flex-col gap-1 hover:shadow"
          >
            <h2 className="font-bold">{a.courses.title}</h2>
            <p className="text-sm text-gray-500">Niveau : {a.courses.niveau}</p>
            <p className="text-sm text-[#e8652d]">Continuer →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}