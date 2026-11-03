'use client'
import Link from 'next/link'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { envoyerEnQuittant } from '@/lib/eval-quitter'

type Question = { id: string; question: string; choices: string[] }
type Detail = { question: string; choices: string[]; reponse: string | null; correct: string; ok: boolean; explication: string | null }
type Resultat = { titre: string; statut: string; score: number; total: number; detail: Detail[] }
type Etat = 'chargement' | 'apercu' | 'passage' | 'resultat' | 'erreur'

function formater(s: number) {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const MESSAGE_STATUT: Record<string, string> = {
  abandon: 'Tu as quitté la page pendant l’évaluation : elle a été terminée automatiquement.',
  expire: 'Le temps est écoulé : l’évaluation a été terminée.',
}

function Evaluation() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [etat, setEtat] = useState<Etat>('chargement')
  const [message, setMessage] = useState('')
  const [apercu, setApercu] = useState<{ titre: string; duree_minutes: number; nb_questions: number } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [restant, setRestant] = useState(0)
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const reponsesRef = useRef<Record<string, string>>({})
  const tokenRef = useRef<string | null>(null)
  const actifRef = useRef(false) // vrai pendant le passage
  const demarreRef = useRef(false) // empêche un double démarrage
  const decalageRef = useRef(0) // heure du serveur - heure du navigateur
  const finRef = useRef(0) // échéance (heure du navigateur)
  const sortieRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const afficherResultat = useCallback(async () => {
    const { data, error } = await supabase.rpc('eval_resultat', { p_code: code })
    if (error) {
      setMessage(error.message)
      setEtat('erreur')
      return
    }
    setResultat(data as Resultat)
    setEtat('resultat')
  }, [code])

  useEffect(() => {
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion')
        return
      }
      const { data, error } = await supabase.rpc('eval_apercu', { p_code: code })
      if (error) {
        setMessage(error.message)
        setEtat('erreur')
        return
      }
      const a = data as { titre: string; duree_minutes: number; nb_questions: number; deja_passee: boolean }
      if (a.deja_passee) {
        afficherResultat()
        return
      }
      setApercu(a)
      setEtat('apercu')
    }
    charger()
  }, [code, afficherResultat, router])

  async function commencer() {
    if (demarreRef.current) return
    demarreRef.current = true
    setMessage('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    tokenRef.current = session?.access_token ?? null
    const { data, error } = await supabase.rpc('eval_demarrer', { p_code: code })
    if (error) {
      setMessage(error.message)
      setEtat('erreur')
      return
    }
    const d = data as {
      termine?: boolean
      message?: string
      deadline?: string
      server_now?: string
      questions?: Question[]
    }
    if (d.termine) {
      setMessage(d.message || '')
      afficherResultat()
      return
    }
    decalageRef.current = new Date(d.server_now as string).getTime() - Date.now()
    finRef.current = new Date(d.deadline as string).getTime() - decalageRef.current
    setQuestions(d.questions || [])
    setRestant(Math.max(0, Math.round((finRef.current - Date.now()) / 1000)))
    actifRef.current = true
    setEtat('passage')
  }

  // Rend l'évaluation (bouton ou fin du chrono)
  const rendre = useCallback(async () => {
    if (!actifRef.current) return
    actifRef.current = false
    setEnvoi(true)
    const { error } = await supabase.rpc('eval_soumettre', { p_code: code, p_reponses: reponsesRef.current })
    setEnvoi(false)
    if (error) setMessage(error.message)
    afficherResultat()
  }, [code, afficherResultat])

  // L'élève quitte : l'évaluation se termine tout de suite, sans reprise possible
  const quitter = useCallback(() => {
    if (!actifRef.current) return
    actifRef.current = false
    envoyerEnQuittant(code, reponsesRef.current, tokenRef.current)
    setMessage(MESSAGE_STATUT.abandon)
    setEtat('chargement')
  }, [code])

  useEffect(() => {
    if (etat !== 'passage') return
    if (sortieRef.current) clearTimeout(sortieRef.current)
    const surVisibilite = () => {
      if (document.visibilityState === 'hidden') quitter()
    }
    document.addEventListener('visibilitychange', surVisibilite)
    window.addEventListener('pagehide', quitter)
    const horloge = setInterval(() => {
      const r = Math.max(0, Math.round((finRef.current - Date.now()) / 1000))
      setRestant(r)
      if (r <= 0) rendre()
    }, 500)
    return () => {
      document.removeEventListener('visibilitychange', surVisibilite)
      window.removeEventListener('pagehide', quitter)
      clearInterval(horloge)
      // Navigation interne (lien du site) : on quitte aussi. Le petit délai évite de
      // déclencher la sortie lors du double montage du mode développement.
      sortieRef.current = setTimeout(quitter, 100)
    }
  }, [etat, quitter, rendre])

  // Quand l'élève revient après être parti, on affiche son résultat
  useEffect(() => {
    if (etat !== 'chargement' || message !== MESSAGE_STATUT.abandon) return
    const reprendre = () => {
      if (document.visibilityState === 'visible') afficherResultat()
    }
    if (document.visibilityState === 'visible') {
      // petit délai pour laisser partir l'envoi des réponses
      const t = setTimeout(afficherResultat, 600)
      return () => clearTimeout(t)
    }
    document.addEventListener('visibilitychange', reprendre)
    return () => document.removeEventListener('visibilitychange', reprendre)
  }, [etat, message, afficherResultat])

  function choisir(id: string, choix: string) {
    reponsesRef.current = { ...reponsesRef.current, [id]: choix }
    setReponses(reponsesRef.current)
  }

  if (etat === 'chargement')
    return (
      <p role="status" className="text-center mt-10">
        {message || 'Chargement...'}
      </p>
    )

  if (etat === 'erreur')
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 flex flex-col gap-4">
        <p role="alert" className="rounded-xl bg-red-50 p-4 font-medium text-red-800">
          {message}
        </p>
        <Link href="/evaluations" className="btn-secondary self-start">
          Mes évaluations
        </Link>
      </div>
    )

  if (etat === 'apercu' && apercu)
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16 flex flex-col gap-5">
        <Link href="/evaluations" className="text-sm text-[#2d3a6b]">
          ← Mes évaluations
        </Link>
        <h1 className="text-2xl font-bold">{apercu.titre}</h1>
        <ul className="rounded-2xl bg-mist p-5 flex flex-col gap-2">
          <li>{apercu.nb_questions} questions à choix multiples</li>
          <li>Durée : {apercu.duree_minutes} minutes, chronomètre affiché en haut de la page</li>
          <li className="font-bold">Une seule tentative, aucun second essai</li>
          <li className="font-bold">
            Si tu quittes la page, changes d&apos;onglet ou fermes la fenêtre, l&apos;évaluation se termine aussitôt
            avec les réponses déjà données.
          </li>
          <li>À la fin, tu vois ton score et la correction.</li>
        </ul>
        <p>Assure-toi d&apos;être au calme et d&apos;avoir une bonne connexion avant de commencer.</p>
        <button type="button" onClick={commencer} className="btn-primary self-start">
          Commencer l&apos;évaluation
        </button>
      </div>
    )

  if (etat === 'passage') {
    const repondues = Object.keys(reponses).length
    return (
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <p className="text-sm">
            {repondues} / {questions.length} réponses
          </p>
          <p
            role="timer"
            aria-label="Temps restant"
            className={`text-xl font-bold tabular-nums ${restant <= 60 ? 'text-red-700' : ''}`}
          >
            {formater(restant)}
          </p>
        </div>
        <ol className="flex flex-col gap-6">
          {questions.map((q, i) => (
            <li key={q.id}>
              <fieldset className="flex flex-col gap-2">
                <legend className="font-medium mb-2">
                  {i + 1}. {q.question}
                </legend>
                {q.choices.map((c) => (
                  <label
                    key={c}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${
                      reponses[q.id] === c ? 'border-[#2d3a6b] bg-mist' : ''
                    }`}
                  >
                    <input type="radio" name={q.id} checked={reponses[q.id] === c} onChange={() => choisir(q.id, c)} />
                    <span>{c}</span>
                  </label>
                ))}
              </fieldset>
            </li>
          ))}
        </ol>
        {message && (
          <p role="alert" className="mt-4 text-red-700">
            {message}
          </p>
        )}
        <button type="button" onClick={rendre} disabled={envoi} className="btn-primary mt-8 disabled:opacity-50">
          {envoi ? 'Envoi...' : 'Terminer et voir mon résultat'}
        </button>
      </div>
    )
  }

  if (etat === 'resultat' && resultat) {
    const pct = resultat.total ? Math.round((100 * resultat.score) / resultat.total) : 0
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16 flex flex-col gap-5">
        <Link href="/evaluations" className="text-sm text-[#2d3a6b]">
          ← Mes évaluations
        </Link>
        <h1 className="text-2xl font-bold">{resultat.titre}</h1>
        {(MESSAGE_STATUT[resultat.statut] || message) && (
          <p role="status" className="rounded-xl bg-amber-50 p-4 font-medium text-amber-900">
            {MESSAGE_STATUT[resultat.statut] || message}
          </p>
        )}
        <div className="rounded-2xl bg-mist p-6 text-center">
          <p className="text-4xl font-bold">
            {resultat.score} / {resultat.total}
          </p>
          <p className="mt-1">{pct} % de bonnes réponses</p>
        </div>
        <h2 className="text-lg font-bold">Correction</h2>
        <ol className="flex flex-col gap-4">
          {resultat.detail.map((d, i) => (
            <li key={i} className={`rounded-2xl border-2 p-4 ${d.ok ? 'border-green-600' : 'border-red-500'}`}>
              <p className="font-medium">
                {i + 1}. {d.question}
              </p>
              <p className="mt-2">
                {d.ok ? '✓ Bonne réponse : ' : '✗ Ta réponse : '}
                <span className="font-bold">{d.reponse ?? 'pas de réponse'}</span>
              </p>
              {!d.ok && (
                <p>
                  Bonne réponse : <span className="font-bold text-green-800">{d.correct}</span>
                </p>
              )}
              {d.explication && <p className="mt-2 text-sm text-gray-700">{d.explication}</p>}
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return null
}

export default function PageEvaluation() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Chargement...</p>}>
      <Evaluation />
    </Suspense>
  )
}
