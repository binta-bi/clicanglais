'use client'
import Link from 'next/link'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { estCodeTest, INFOS_TEST, type EtatTests } from '@/lib/tests'

type Question = {
  id: string
  position: number
  partie: string | null
  question: string
  choices: string[]
}
type Etape = 'chargement' | 'intro' | 'test' | 'envoi' | 'echec'

function formater(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function TestClient() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [etape, setEtape] = useState<Etape>('chargement')
  const [questions, setQuestions] = useState<Question[]>([])
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [attemptId, setAttemptId] = useState('')
  const [reprise, setReprise] = useState(false)
  const [test1Reussi, setTest1Reussi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [reste, setReste] = useState(0)
  const echeanceRef = useRef(0)
  const reponsesRef = useRef<Record<string, string>>({})
  const dejaEnvoye = useRef(false)

  useEffect(() => {
    reponsesRef.current = reponses
    if (!attemptId) return
    try {
      sessionStorage.setItem(`clic-test-${attemptId}`, JSON.stringify(reponses))
    } catch {
      // stockage indisponible : les réponses restent en mémoire
    }
  }, [reponses, attemptId])

  // Au chargement : vérifie la connexion et l'état du test
  useEffect(() => {
    if (!estCodeTest(code)) return
    let annule = false
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/connexion')
        return
      }
      const { data, error } = await supabase.rpc('my_test_status')
      if (annule) return
      if (error) {
        setErreur(error.message)
        setEtape('intro')
        return
      }
      const etat = data as EtatTests
      const tentative = etat[code as 'test1' | 'test2']
      if (tentative && tentative.status !== 'en_cours') {
        router.replace(`/resultat-test?test=${code}`)
        return
      }
      setReprise(tentative?.status === 'en_cours')
      setTest1Reussi(etat.test1?.status === 'reussi')
      setEtape('intro')
    }
    init()
    return () => {
      annule = true
    }
  }, [code, router])

  const envoyer = useCallback(async () => {
    if (dejaEnvoye.current || !estCodeTest(code)) return
    dejaEnvoye.current = true
    setErreur('')
    setEtape('envoi')
    const { error } = await supabase.rpc('submit_test', {
      p_test: code,
      p_answers: reponsesRef.current,
    })
    if (error) {
      dejaEnvoye.current = false
      setErreur(error.message)
      setEtape('echec')
      return
    }
    try {
      sessionStorage.removeItem(`clic-test-${attemptId}`)
    } catch {
      // sans importance
    }
    router.push(`/resultat-test?test=${code}`)
  }, [code, attemptId, router])

  // Chronomètre : envoi automatique à 0:00
  useEffect(() => {
    if (etape !== 'test') return
    const id = setInterval(() => {
      const r = echeanceRef.current - Date.now()
      setReste(r)
      if (r <= 0) envoyer()
    }, 500)
    return () => clearInterval(id)
  }, [etape, envoyer])

  // Prévient si on essaie de quitter la page pendant le test
  useEffect(() => {
    if (etape !== 'test') return
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avertir)
    return () => window.removeEventListener('beforeunload', avertir)
  }, [etape])

  async function chargerQuestions() {
    const { data, error } = await supabase.rpc('get_test_questions', { p_test: code })
    if (error) {
      setErreur(error.message)
      return
    }
    const d = data as { attempt_id: string; deadline: string; server_now: string; questions: Question[] }
    // Temps restant mesuré par le serveur, pour ne pas dépendre de l'horloge de l'élève
    const restant = new Date(d.deadline).getTime() - new Date(d.server_now).getTime()
    echeanceRef.current = Date.now() + restant
    let sauvegarde: Record<string, string> = {}
    try {
      const brut = sessionStorage.getItem(`clic-test-${d.attempt_id}`)
      if (brut) sauvegarde = JSON.parse(brut)
    } catch {
      // pas de sauvegarde exploitable
    }
    setAttemptId(d.attempt_id)
    setReponses(sauvegarde)
    setQuestions(d.questions)
    setReste(restant)
    dejaEnvoye.current = false
    setEtape('test')
  }

  async function commencer() {
    if (!estCodeTest(code)) return
    setErreur('')
    const confirme = new URLSearchParams(window.location.search).get('confirme') === '1'
    const { error } = await supabase.rpc('start_test', { p_test: code, p_confident: confirme })
    if (error) {
      setErreur(error.message)
      return
    }
    await chargerQuestions()
  }

  function valider() {
    const manquantes = questions.length - questions.filter((q) => reponses[q.id]).length
    if (
      manquantes > 0 &&
      !window.confirm(
        `Il te reste ${manquantes} question${manquantes > 1 ? 's' : ''} sans réponse. Une question sans réponse compte comme fausse. Envoyer quand même ?`
      )
    ) {
      return
    }
    envoyer()
  }

  if (!estCodeTest(code)) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-2xl font-bold">Test inconnu</h1>
        <Link href="/niveau" className="btn-primary mt-6">
          Retour au choix du niveau
        </Link>
      </div>
    )
  }

  const info = INFOS_TEST[code]

  if (etape === 'chargement' || etape === 'envoi') {
    return (
      <p role="status" className="mx-auto mt-16 max-w-3xl px-5 text-center text-lg">
        {etape === 'envoi' ? 'Envoi de tes réponses...' : 'Chargement...'}
      </p>
    )
  }

  if (etape === 'echec') {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-2xl font-bold">Tes réponses n&apos;ont pas pu être envoyées</h1>
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-medium text-red-800">
          {erreur}
        </p>
        <p className="mt-4 text-ink/80">
          Tes réponses sont conservées sur cette page. Vérifie ta connexion puis réessaie.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={envoyer} className="btn-primary">
            Réessayer l&apos;envoi
          </button>
          <Link href={`/resultat-test?test=${code}`} className="btn-secondary">
            Voir mon résultat
          </Link>
        </div>
      </div>
    )
  }

  if (etape === 'intro') {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{info.titre}</h1>
        <ul className="mt-6 flex flex-col gap-3 text-lg leading-snug">
          <li>{info.nbQuestions} questions à choix multiple.</li>
          <li>
            {info.minutes} minutes. Le chronomètre démarre quand tu cliques sur « Commencer le test » et
            continue même si tu quittes la page.
          </li>
          <li>
            Il faut au moins {info.bonnesReponses} bonnes réponses sur {info.nbQuestions} ({info.seuil} %).
          </li>
          <li>Un seul essai : ce test ne se repasse pas.</li>
          <li>Une question sans réponse compte comme fausse. Si le temps est écoulé, le test est échoué.</li>
          <li>
            {code === 'test1'
              ? 'Si tu réussis, tu commences au niveau Intermédiaire. Sinon, tu commences au niveau Débutant.'
              : test1Reussi
                ? 'Si tu réussis, tu commences au niveau Avancé. Sinon, tu gardes le niveau Intermédiaire.'
                : 'Si tu réussis, tu commences au niveau Avancé. Sinon, tu passes le test Intermédiaire.'}
          </li>
        </ul>
        {erreur && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 font-medium text-red-800">
            {erreur}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={commencer} className="btn-primary">
            {reprise ? 'Reprendre le test' : 'Commencer le test'}
          </button>
          <Link href="/niveau" className="btn-secondary">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  // etape === 'test'
  const repondues = questions.filter((q) => reponses[q.id]).length
  const dernieresMinutes = reste < 5 * 60 * 1000

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
          <p className="font-medium">
            {repondues} / {questions.length} réponses
          </p>
          <p role="timer" className="text-right">
            {dernieresMinutes && <span className="mr-2 text-sm font-bold text-brand-dark">Dernières minutes</span>}
            <span className="text-sm text-ink/70">Temps restant </span>
            <span className={`text-xl font-extrabold tabular-nums ${dernieresMinutes ? 'text-brand-dark' : ''}`}>
              {formater(reste)}
            </span>
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          valider()
        }}
        className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8"
      >
        {questions.map((q, i) => (
          <div key={q.id} className="flex flex-col gap-5">
            {q.partie && q.partie !== questions[i - 1]?.partie && (
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Questions de niveau {q.partie}</h2>
            )}
            <fieldset className="rounded-2xl p-5 ring-1 ring-line">
              <legend className="px-1 text-lg font-bold leading-snug">
                <span className="mr-2 text-brand-dark">{q.position}.</span>
                {q.question}
              </legend>
              <div className="mt-3 grid gap-2">
                {q.choices.map((choix) => (
                  <label
                    key={choix}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-line px-4 py-3 hover:bg-mist has-[:checked]:border-navy has-[:checked]:bg-mist"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={choix}
                      checked={reponses[q.id] === choix}
                      onChange={() => setReponses((r) => ({ ...r, [q.id]: choix }))}
                      className="size-5 shrink-0 accent-navy"
                    />
                    <span>{choix}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ))}

        <div className="mt-2 flex flex-col gap-3">
          <p className="text-ink/80">Tu peux changer tes réponses jusqu&apos;à l&apos;envoi.</p>
          <button type="submit" className="btn-primary w-fit">
            Envoyer mes réponses
          </button>
        </div>
      </form>
    </div>
  )
}

// useParams() doit être lu sous <Suspense> pour que le site se compile en production
export default function PageTest() {
  return (
    <Suspense
      fallback={
        <p role="status" className="mx-auto mt-16 max-w-3xl px-5 text-center text-lg">
          Chargement...
        </p>
      }
    >
      <TestClient />
    </Suspense>
  )
}
