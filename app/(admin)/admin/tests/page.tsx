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
      <h1 className="text-3xl font-extrabold tracking-tight text-nuit">Tests de niveau</h1>
      <div className="flex flex-col gap-3">
        {tests.map((t) => {
          const total = nombres[t.code] ?? 0
          const requis = Math.ceil((total * t.seuil_pct) / 100)
          return (
            <div key={t.code} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line flex flex-col gap-2">
              <p className="font-bold">{t.title}</p>
              <p className="text-sm text-ardoise-texte">
                {total} question{total > 1 ? 's' : ''} · {t.duree_minutes} minutes · réussite à {t.seuil_pct} %
                {total > 0 && ` (${requis} bonnes réponses sur ${total})`}
              </p>
              <Link
                href={`/admin/tests/${t.code}`}
                className="self-start rounded-full border-2 border-navy px-4 py-1.5 font-semibold text-navy hover:bg-navy hover:text-white text-sm"
              >
                Gérer les questions
              </Link>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-ardoise-texte">
        Modifier les questions n&apos;change pas les résultats déjà enregistrés. Évite de les modifier pendant
        qu&apos;un élève passe le test.
      </p>
    </div>
  )
}
