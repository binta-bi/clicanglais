'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

type Ligne = {
  code: string
  niveau: NiveauSlug
  mois: number | null
  titre: string
  duree_minutes: number
  accessible: boolean
  fait: boolean
  score: number | null
  total: number | null
}

export default function Evaluations() {
  const router = useRouter()
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion')
        return
      }
      const { data, error } = await supabase.rpc('eval_liste')
      if (error) setErreur(error.message)
      setLignes((data as Ligne[]) || [])
      setChargement(false)
    }
    charger()
  }, [router])

  const niveaux = Array.from(new Set(lignes.map((l) => l.niveau)))

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 pb-16 flex flex-col gap-6">
      <Link href="/mes-cours" className="text-sm text-[#2d3a6b]">
        ← Mes cours
      </Link>
      <h1 className="text-2xl font-bold">Mes évaluations</h1>
      <p>
        Une évaluation se passe une seule fois. Elle est chronométrée : si tu quittes la page, elle se termine
        aussitôt.
      </p>

      {chargement && <p role="status">Chargement...</p>}
      {erreur && (
        <p role="alert" className="text-red-700">
          {erreur}
        </p>
      )}
      {!chargement && lignes.length === 0 && (
        <div className="rounded-2xl bg-mist p-5">Aucune évaluation n&apos;est disponible pour l&apos;instant.</div>
      )}

      {niveaux.map((n) => (
        <section key={n} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Niveau {NOM_NIVEAU[n]}</h2>
          {lignes
            .filter((l) => l.niveau === n)
            .map((l) => (
              <div key={l.code} className="border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{l.titre}</p>
                  <p className="text-sm text-gray-600">
                    {l.fait
                      ? `Terminée · ${l.score} / ${l.total}`
                      : l.accessible
                        ? `${l.duree_minutes} minutes · une seule tentative`
                        : l.mois
                          ? 'Disponible après l’achat de ce mois'
                          : 'Disponible quand les 3 mois du niveau sont acquis'}
                  </p>
                </div>
                {l.fait ? (
                  <Link href={`/evaluations/${l.code}`} className="btn-secondary">
                    Voir mon résultat
                  </Link>
                ) : l.accessible ? (
                  <Link href={`/evaluations/${l.code}`} className="btn-primary">
                    Passer l&apos;évaluation
                  </Link>
                ) : (
                  <span className="text-sm text-gray-500">Verrouillée</span>
                )}
              </div>
            ))}
        </section>
      ))}
    </div>
  )
}
