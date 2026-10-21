'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { INFOS_TEST, NOM_NIVEAU, type CodeTest, type EtatTests } from '@/lib/tests'

export default function ChoixNiveau() {
  const router = useRouter()
  const [etat, setEtat] = useState<EtatTests | null>(null)
  const [erreur, setErreur] = useState('')
  const [confirme, setConfirme] = useState(false)
  const [envoi, setEnvoi] = useState(false)

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
      if (error) setErreur(error.message)
      else setEtat(data as EtatTests)
    }
    charger()
  }, [router])

  async function commencerDebutant() {
    setEnvoi(true)
    setErreur('')
    const { error } = await supabase.rpc('choose_debutant')
    if (error) {
      setErreur(error.message)
      setEnvoi(false)
      return
    }
    router.push('/cours')
  }

  if (!etat && !erreur) {
    return (
      <p role="status" className="mx-auto mt-16 max-w-3xl px-5 text-center">
        Chargement...
      </p>
    )
  }

  const enCours: CodeTest | null =
    etat?.test1?.status === 'en_cours' ? 'test1' : etat?.test2?.status === 'en_cours' ? 'test2' : null
  const afficherDebutant = !!etat && etat.niveau === null && !enCours
  const afficherTest1 = !!etat && etat.test1_disponible && !enCours
  const afficherTest2 = !!etat && etat.test2_disponible && !enCours && etat.suite !== 'test1'

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
        Choisis ton point de départ
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/80">
        Le niveau Débutant est ouvert à tous. Pour entrer plus haut, passe un test gratuit. Chaque
        test ne se passe qu&apos;une seule fois.
      </p>

      {erreur && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 font-medium text-red-800">
          {erreur}
        </p>
      )}

      {etat?.niveau && (
        <section className="mt-8 rounded-2xl bg-mist p-6">
          <p className="text-sm font-semibold text-ink/70">Ton niveau de départ</p>
          <p className="text-3xl font-extrabold">{NOM_NIVEAU[etat.niveau]}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cours" className="btn-primary">
              Voir les cours
            </Link>
            <Link href="/mes-cours" className="btn-secondary">
              Mes cours
            </Link>
          </div>
        </section>
      )}

      {etat?.suite === 'test1' && (
        <section className="mt-8 rounded-2xl bg-mist p-6">
          <p className="text-lg font-bold">Tu n&apos;as pas réussi le test Avancé.</p>
          <p className="mt-1 text-ink/80">
            Passe maintenant le test Intermédiaire : il fixera ton niveau de départ.
          </p>
        </section>
      )}

      {enCours && (
        <section className="mt-8 rounded-2xl border-2 border-brand-deep p-6">
          <p className="text-lg font-bold">Tu as un test en cours.</p>
          <p className="mt-1 text-ink/80">Le chronomètre continue de tourner. Reprends-le maintenant.</p>
          <Link href={`/test/${enCours}`} className="btn-primary mt-4">
            Reprendre le {INFOS_TEST[enCours].titre.toLowerCase()}
          </Link>
        </section>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {afficherDebutant && (
          <section className="flex flex-col rounded-2xl p-6 ring-1 ring-line">
            <h2 className="text-xl font-bold">Niveau Débutant</h2>
            <p className="mt-2 flex-1 leading-relaxed text-ink/80">
              Tu commences par les bases, sans test.
            </p>
            <button onClick={commencerDebutant} disabled={envoi} className="btn-secondary mt-5 disabled:opacity-50">
              Commencer au niveau Débutant
            </button>
          </section>
        )}

        {afficherTest1 && (
          <section className="flex flex-col rounded-2xl p-6 ring-1 ring-line">
            <h2 className="text-xl font-bold">Test Intermédiaire</h2>
            <p className="mt-2 flex-1 leading-relaxed text-ink/80">
              {INFOS_TEST.test1.nbQuestions} questions, {INFOS_TEST.test1.minutes} minutes,{' '}
              {INFOS_TEST.test1.bonnesReponses} bonnes réponses pour entrer en Intermédiaire.
            </p>
            <Link href="/test/test1" className="btn-primary mt-5">
              Passer le test Intermédiaire
            </Link>
          </section>
        )}

        {afficherTest2 && (
          <section className="flex flex-col rounded-2xl p-6 ring-1 ring-line">
            <h2 className="text-xl font-bold">Test Avancé</h2>
            <p className="mt-2 leading-relaxed text-ink/80">
              {INFOS_TEST.test2.nbQuestions} questions, {INFOS_TEST.test2.minutes} minutes,{' '}
              {INFOS_TEST.test2.bonnesReponses} bonnes réponses pour entrer en Avancé.
            </p>
            {etat.test2_confirmation_requise ? (
              <>
                <label className="mt-3 flex flex-1 cursor-pointer items-start gap-3 leading-snug">
                  <input
                    type="checkbox"
                    checked={confirme}
                    onChange={(e) => setConfirme(e.target.checked)}
                    className="mt-1 size-5 shrink-0 accent-navy"
                  />
                  <span>Je pense déjà maîtriser le niveau Intermédiaire</span>
                </label>
                <button
                  onClick={() => router.push('/test/test2?confirme=1')}
                  disabled={!confirme}
                  className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Passer le test Avancé
                </button>
              </>
            ) : (
              <Link href="/test/test2" className="btn-primary mt-5">
                Passer le test Avancé
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
