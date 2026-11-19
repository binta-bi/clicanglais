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
    <div className="hero-ivoire min-h-[calc(100dvh-4.2rem)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
        <Link href="/mes-cours" className="text-sm font-semibold text-royal">
          ← Mes cours
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-nuit sm:text-4xl">Mes évaluations</h1>
        <p className="rounded-2xl bg-white p-4 text-ardoise-texte ring-1 ring-nuit/10">
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
          <div className="rounded-2xl bg-white p-5 ring-1 ring-nuit/10">
            Aucune évaluation n&apos;est disponible pour l&apos;instant.
          </div>
        )}

        {niveaux.map((n) => (
          <section key={n} className="flex flex-col gap-3">
            <h2 className="text-lg font-extrabold text-nuit">Niveau {NOM_NIVEAU[n]}</h2>
            {lignes
              .filter((l) => l.niveau === n)
              .map((l) => (
                <div
                  key={l.code}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-nuit/10 ${
                    !l.accessible && !l.fait ? 'opacity-70' : ''
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-nuit">{l.titre}</p>
                    <p className="text-sm text-ardoise-texte">
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
                    <Link href={`/evaluations/${l.code}`} className="btn-hero">
                      Passer l&apos;évaluation
                    </Link>
                  ) : (
                    <span className="text-sm text-ardoise-texte">Verrouillée</span>
                  )}
                </div>
              ))}
          </section>
        ))}
      </div>
    </div>
  )
}
