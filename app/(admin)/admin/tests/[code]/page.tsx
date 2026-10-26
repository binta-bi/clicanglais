'use client'
import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Question = {
  id: string
  position: number
  partie: string | null
  question: string
  choices: string[]
  correct_answer: string | null
}

function Formulaire({
  initiale,
  testCode,
  onFini,
  onAnnuler,
}: {
  initiale: Question | null
  testCode: string
  onFini: () => void
  onAnnuler: () => void
}) {
  const [partie, setPartie] = useState(initiale?.partie || '')
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
    const { error } = await supabase.rpc('prof_save_question', {
      p_test: testCode,
      p_id: initiale?.id ?? null,
      p_partie: partie,
      p_question: question,
      p_choices: propres,
      p_correct: propres[bonne],
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
        Partie (facultatif)
        <input
          value={partie} onChange={(e) => setPartie(e.target.value)}
          className="border p-2 rounded font-normal bg-white"
        />
      </label>
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

function GererQuestions() {
  const { code } = useParams<{ code: string }>()
  const [titre, setTitre] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [edition, setEdition] = useState<string | null>(null) // id, 'nouvelle' ou null
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data: t } = await supabase.from('tests').select('title').eq('code', code).single()
    setTitre(t?.title || '')
    const { data, error } = await supabase.rpc('prof_get_questions', { p_test: code })
    if (error) setErreur(error.message)
    setQuestions((data as Question[]) || [])
    setChargement(false)
  }, [code])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function deplacer(id: string, sens: -1 | 1) {
    setErreur('')
    const { error } = await supabase.rpc('prof_move_question', { p_id: id, p_dir: sens })
    if (error) setErreur(error.message)
    charger()
  }

  async function supprimer(q: Question, n: number) {
    if (!confirm(`Supprimer la question ${n} ?\n\n${q.question}`)) return
    setErreur('')
    const { error } = await supabase.rpc('prof_delete_question', { p_id: q.id })
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
        <Link href="/admin/tests" className="text-sm text-[#2d3a6b]">← Tests</Link>
        <h1 className="text-2xl font-bold mt-2">{titre || 'Test'}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {questions.length} question{questions.length > 1 ? 's' : ''}. Les élèves ne voient jamais les bonnes réponses.
        </p>
      </div>

      {erreur && <p role="alert" className="text-red-500 text-sm">{erreur}</p>}

      {edition === 'nouvelle' ? (
        <Formulaire initiale={null} testCode={code} onFini={fini} onAnnuler={() => setEdition(null)} />
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
              key={q.id} initiale={q} testCode={code}
              onFini={fini} onAnnuler={() => setEdition(null)}
            />
          ) : (
            <div key={q.id} className="border rounded p-4 flex flex-col gap-2">
              {q.partie && <p className="text-xs uppercase text-gray-500">{q.partie}</p>}
              <p className="font-medium">{i + 1}. {q.question}</p>
              <ul className="text-sm flex flex-col gap-1">
                {q.choices.map((c) => (
                  <li key={c} className={c === q.correct_answer ? 'text-green-700 font-bold' : 'text-gray-700'}>
                    {c === q.correct_answer ? '✓ ' : '• '}{c}
                  </li>
                ))}
              </ul>
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
    </div>
  )
}

export default function PageQuestions() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Chargement...</p>}>
      <GererQuestions />
    </Suspense>
  )
}
