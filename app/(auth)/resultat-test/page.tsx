'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { estCodeTest, INFOS_TEST, NOM_NIVEAU, type CodeTest, type EtatTests } from '@/lib/tests'

export default function ResultatTest() {
  const router = useRouter()
  const [etat, setEtat] = useState<EtatTests | null>(null)
  const [code, setCode] = useState<CodeTest>('test1')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/connexion')
        return
      }
      const { data, error } = await supabase.rpc('my_test_status')
      if (error) {
        setErreur(error.message)
        return
      }
      const e = data as EtatTests
      const demande = new URLSearchParams(window.location.search).get('test') ?? undefined
      const termine = (t: EtatTests['test1']) => !!t && t.status !== 'en_cours'
      const choisi: CodeTest = estCodeTest(demande) ? demande : termine(e.test2) ? 'test2' : 'test1'
      setCode(choisi)
      setEtat(e)
    }
    charger()
  }, [router])

  if (erreur) {
    return (
      <p role="alert" className="mx-auto mt-16 max-w-3xl px-5 font-medium text-red-800">
        {erreur}
      </p>
    )
  }
  if (!etat) {
    return (
      <p role="status" className="mx-auto mt-16 max-w-3xl px-5 text-center">
        Chargement...
      </p>
    )
  }

  const tentative = etat[code]
  const info = INFOS_TEST[code]

  if (!tentative || tentative.status === 'en_cours') {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight">Pas encore de résultat</h1>
        <p className="mt-3 text-lg text-ink/80">
          {tentative ? 'Ce test est encore en cours.' : 'Tu n’as pas encore passé ce test.'}
        </p>
        <Link href={tentative ? `/test/${code}` : '/niveau'} className="btn-primary mt-6">
          {tentative ? 'Reprendre le test' : 'Choisir mon niveau'}
        </Link>
      </div>
    )
  }

  const reussi = tentative.status === 'reussi'
  const expire = tentative.status === 'expire'
  const pourcentage =
    tentative.score !== null && tentative.total ? Math.round((tentative.score / tentative.total) * 100) : null

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-lg font-semibold text-ink/70">{info.titre}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {reussi ? 'Bravo, tu as réussi !' : expire ? 'Le temps est écoulé' : 'Tu n’as pas atteint le seuil'}
      </h1>

      <section className="mt-8 rounded-2xl bg-mist p-6">
        {expire ? (
          <p className="text-lg">
            Tes réponses ont été reçues après la fin du chronomètre. Le test est considéré comme échoué.
          </p>
        ) : (
          <>
            <p className="text-5xl font-extrabold tabular-nums">
              {tentative.score} <span className="text-3xl text-ink/60">/ {tentative.total}</span>
            </p>
            <p className="mt-2 text-lg">
              {pourcentage} % de bonnes réponses. Il en fallait au moins {info.bonnesReponses} ({info.seuil} %).
            </p>
          </>
        )}
      </section>

      <section className="mt-6">
        {etat.niveau ? (
          <p className="text-xl">
            Tu commences au niveau <strong>{NOM_NIVEAU[etat.niveau]}</strong>.
          </p>
        ) : etat.suite === 'test1' ? (
          <p className="text-xl">
            Ton niveau n&apos;est pas encore fixé. Passe maintenant le <strong>test Intermédiaire</strong>.
          </p>
        ) : null}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {etat.suite === 'test1' && etat.test1_disponible ? (
          <Link href="/test/test1" className="btn-primary">
            Passer le test Intermédiaire
          </Link>
        ) : (
          <Link href="/cours" className="btn-primary">
            Voir les cours
          </Link>
        )}
        <Link href="/mes-cours" className="btn-secondary">
          Mes cours
        </Link>
      </div>
    </div>
  )
}
