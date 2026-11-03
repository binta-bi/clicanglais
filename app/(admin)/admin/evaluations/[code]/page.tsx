'use client'
import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Question = {
  id: string
  position: number
  explication: string | null
  question: string
  choices: string[]
  correct_answer: string | null
}

type Resultat = { email: string; statut: string; score: number; total: number; submitted_at: string }

function Formulaire({
  initiale,
  evalCode,
  onFini,
  onAnnuler,
}: {
  initiale: Question | null
  evalCode: string
  onFini: () => void
  onAnnuler: () => void
}) {
  const [explication, setExplication] = useState(initiale?.explication || '')
  const [question, setQuestion] = useState(initiale?.question || '')
  const [choix, setChoix] = useState<string[]>(initiale?.choices?.length ? initiale.choices : ['', '', '', ''])
  const [bonne, setBonne] = useState(() => {
    const i = initiale ? initiale.choices.indexOf(initiale.correct_answer || '') : -1
    return i >= 0 ? i : 0
  })
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  function changerChoix(i: number, v: string) {
    setChoix((c) => c.map((x, k) => (k === i ? v : x)))
  }

  function retirerChoix(i: number) {
    setChoix((c) => c.filter((_, k) => k !== i))
    setBonne((b) => (i === b ? 0 : i < b ? b - 1 : b))
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    const propres = choix.map((c) => c.trim())
    if (propres.some((c) => c === '')) {
      setErreur('Remplis tous les choix, ou retire ceux qui sont vides.')
      return
    }
    if (new Set(propres).size !== propres.length) {
      setErreur('Deux choix sont identiques.')
      return
    }
    setEnvoi(true)
    const { error } = await supabase.rpc('prof_eval_save_question', {
      p_code: evalCode,
      p_id: initiale?.id ?? null,
      p_question: question,
      p_choices: propres,
      p_correct: propres[bonne],
      p_explication: explication,
    })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    onFini()
  }

  return (
    <form onSubmit={enregistrer} className="border rounded p-4 flex flex-col gap-3 bg-gray-50">
      <h3 className="font-bold">{initiale ? 'Modifier la question' : 'Nouvelle question'}</h3>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Question
        <textarea
          value={question} rows={2} required onChange={(e) => setQuestion(e.target.value)}
          className="border p-2 rounded font-normal bg-white"
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">Choix (coche la bonne réponse)</legend>
        {choix.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio" name="bonne" checked={bonne === i} onChange={() => setBonne(i)}
              aria-label={`Bonne réponse : choix ${i + 1}`}
            />
            <input
              value={c} onChange={(e) => changerChoix(i, e.target.value)}
              aria-label={`Choix ${i + 1}`}
              className="border p-2 rounded flex-1 min-w-0 bg-white"
            />
            {choix.length > 2 && (
              <button
                type="button" onClick={() => retirerChoix(i)}
                aria-label={`Retirer le choix ${i + 1}`}
                className="text-red-500 border border-red-500 rounded px-2 py-1 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {choix.length < 6 && (
          <button
            type="button" onClick={() => setChoix((c) => [...c, ''])}
            className="self-start text-sm text-[#2d3a6b] underline"
          >
            + Ajouter un choix
          </button>
        )}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Explication montrée à l&apos;élève après l&apos;évaluation (facultatif)
        <textarea
          value={explication} rows={2} onChange={(e) => setExplication(e.target.value)}
          className="border p-2 rounded font-normal bg-white"
        />
      </label>
      {erreur && <p role="alert" className="text-red-500 text-sm">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={envoi} className="bg-[#2d3a6b] text-white px-4 py-2 rounded disabled:opacity-50">
          {envoi ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onAnnuler} className="border px-4 py-2 rounded">
          Annuler
        </button>
      </div>
    </form>
  )
}

function GererEvaluation() {
  const { code } = useParams<{ code: string }>()
  const [titre, setTitre] = useState('')
  const [publiee, setPubliee] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [edition, setEdition] = useState<string | null>(null) // id, 'nouvelle' ou null
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data: liste } = await supabase.rpc('prof_eval_liste')
    const ligne = ((liste as { code: string; titre: string; is_published: boolean }[]) || []).find((l) => l.code === code)
    setTitre(ligne?.titre || '')
    setPubliee(!!ligne?.is_published)
    const { data, error } = await supabase.rpc('prof_eval_questions', { p_code: code })
    if (error) setErreur(error.message)
    setQuestions((data as Question[]) || [])
    const { data: res } = await supabase.rpc('prof_eval_resultats', { p_code: code })
    setResultats((res as Resultat[]) || [])
    setChargement(false)
  }, [code])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function basculerPublication() {
    setErreur('')
    const { error } = await supabase.rpc('prof_eval_publier', { p_code: code, p_publie: !publiee })
    if (error) setErreur(error.message)
    charger()
  }

  async function deplacer(id: string, sens: -1 | 1) {
    setErreur('')
    const { error } = await supabase.rpc('prof_eval_move_question', { p_id: id, p_dir: sens })
    if (error) setErreur(error.message)
    charger()
  }

  async function supprimer(q: Question, n: number) {
    if (!confirm(`Supprimer la question ${n} ?\n\n${q.question}`)) return
    setErreur('')
    const { error } = await supabase.rpc('prof_eval_delete_question', { p_id: q.id })
    if (error) setErreur(error.message)
    setEdition(null)
    charger()
  }

  function fini() {
    setEdition(null)
    charger()
  }

  if (chargement) return <p>Chargement...</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/evaluations" className="text-sm text-[#2d3a6b]">← Évaluations</Link>
        <h1 className="text-2xl font-bold mt-2">{titre || 'Évaluation'}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {questions.length} question{questions.length > 1 ? 's' : ''}. Les élèves ne voient les bonnes réponses
          qu&apos;après avoir terminé. Durée : 30 minutes, une seule tentative.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className={`text-sm font-bold ${publiee ? 'text-green-700' : 'text-gray-600'}`}>
            {publiee ? 'Publiée : visible par les élèves concernés' : 'Brouillon : invisible pour les élèves'}
          </span>
          <button onClick={basculerPublication} className="border border-[#2d3a6b] text-[#2d3a6b] px-3 py-1 rounded text-sm">
            {publiee ? 'Dépublier' : 'Publier'}
          </button>
        </div>
      </div>

      {erreur && <p role="alert" className="text-red-500 text-sm">{erreur}</p>}

      {edition === 'nouvelle' ? (
        <Formulaire initiale={null} evalCode={code} onFini={fini} onAnnuler={() => setEdition(null)} />
      ) : (
        <button
          onClick={() => setEdition('nouvelle')}
          className="self-start bg-[#2d3a6b] text-white px-4 py-2 rounded"
        >
          + Ajouter une question
        </button>
      )}

      <div className="flex flex-col gap-3">
        {questions.map((q, i) =>
          edition === q.id ? (
            <Formulaire
              key={q.id} initiale={q} evalCode={code}
              onFini={fini} onAnnuler={() => setEdition(null)}
            />
          ) : (
            <div key={q.id} className="border rounded p-4 flex flex-col gap-2">
              <p className="font-medium">{i + 1}. {q.question}</p>
              <ul className="text-sm flex flex-col gap-1">
                {q.choices.map((c) => (
                  <li key={c} className={c === q.correct_answer ? 'text-green-700 font-bold' : 'text-gray-700'}>
                    {c === q.correct_answer ? '✓ ' : '• '}{c}
                  </li>
                ))}
              </ul>
              {q.explication && <p className="text-sm text-gray-600">Explication : {q.explication}</p>}
              {!q.correct_answer && (
                <p className="text-sm text-red-500">Aucune bonne réponse définie : modifie cette question.</p>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                <button onClick={() => deplacer(q.id, -1)} disabled={i === 0} aria-label={`Monter la question ${i + 1}`} className="border px-3 py-1 rounded disabled:opacity-30">↑</button>
                <button onClick={() => deplacer(q.id, 1)} disabled={i === questions.length - 1} aria-label={`Descendre la question ${i + 1}`} className="border px-3 py-1 rounded disabled:opacity-30">↓</button>
                <button onClick={() => setEdition(q.id)} className="border border-[#2d3a6b] text-[#2d3a6b] px-3 py-1 rounded">Modifier</button>
                <button onClick={() => supprimer(q, i + 1)} className="border border-red-500 text-red-500 px-3 py-1 rounded">Supprimer</button>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Résultats des élèves</h2>
        {resultats.length === 0 && <p className="text-sm text-gray-600">Personne n&apos;a encore passé cette évaluation.</p>}
        {resultats.map((r) => (
          <p key={r.email + r.submitted_at} className="text-sm border-b py-1">
            {r.email} : <span className="font-bold">{r.score} / {r.total}</span>
            {r.statut === 'abandon' && ' (a quitté la page)'}
            {r.statut === 'expire' && ' (temps dépassé)'}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function PageEvaluationProf() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Chargement...</p>}>
      <GererEvaluation />
    </Suspense>
  )
}
