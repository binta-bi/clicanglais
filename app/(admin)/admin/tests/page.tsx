'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Test = { code: string; title: string; duree_minutes: number; seuil_pct: number }

export default function PageTests() {
  const [tests, setTests] = useState<Test[]>([])
  const [nombres, setNombres] = useState<Record<string, number>>({})
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from('tests')
        .select('code, title, duree_minutes, seuil_pct')
        .order('code')
      const liste = (data as Test[]) || []
      setTests(liste)
      const n: Record<string, number> = {}
      for (const t of liste) {
        const { data: qs } = await supabase.rpc('prof_get_questions', { p_test: t.code })
        n[t.code] = Array.isArray(qs) ? qs.length : 0
      }
      setNombres(n)
      setChargement(false)
    }
    charger()
  }, [])

  if (chargement) return <p>Chargement...</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Tests de niveau</h1>
      <div className="flex flex-col gap-3">
        {tests.map((t) => {
          const total = nombres[t.code] ?? 0
          const requis = Math.ceil((total * t.seuil_pct) / 100)
          return (
            <div key={t.code} className="border rounded p-4 flex flex-col gap-2">
              <p className="font-bold">{t.title}</p>
              <p className="text-sm text-gray-600">
                {total} question{total > 1 ? 's' : ''} · {t.duree_minutes} minutes · réussite à {t.seuil_pct} %
                {total > 0 && ` (${requis} bonnes réponses sur ${total})`}
              </p>
              <Link
                href={`/admin/tests/${t.code}`}
                className="self-start border border-[#2d3a6b] text-[#2d3a6b] px-3 py-1 rounded text-sm"
              >
                Gérer les questions
              </Link>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-gray-600">
        Modifier les questions n&apos;change pas les résultats déjà enregistrés. Évite de les modifier pendant
        qu&apos;un élève passe le test.
      </p>
    </div>
  )
}
