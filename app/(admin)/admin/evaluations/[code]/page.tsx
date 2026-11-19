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
    <form onSubmit={enregistrer} className="rounded-2xl bg-mist p-4 flex flex-col gap-3 ring-1 ring-line">
      <h3 className="font-bold">{initiale ? 'Modifier la question' : 'Nouvelle question'}</h3>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Question
        <textarea
          value={question} rows={2} required onChange={(e) => setQuestion(e.target.value)}
          className="champ-auth !py-2 font-normal"
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
              className="champ-auth !py-2 flex-1 min-w-0"
            />
            {choix.length > 2 && (
              <button
                type="button" onClick={() => retirerChoix(i)}
                aria-label={`Retirer le choix ${i + 1}`}
                className="rounded-full border-2 border-red-500 px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {choix.length < 6 && (
          <button
            type="button" onClick={() => setChoix((c) => [...c, ''])}
            className="self-start text-sm font-semibold text-royal underline"
          >
            + Ajouter un choix
          </button>
        )}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Explication montrée à l&apos;élève après l&apos;évaluation (facultatif)
        <textarea
          value={explication} rows={2} onChange={(e) => setExplication(e.target.value)}
          className="champ-auth !py-2 font-normal"
        />
      </label>
      {erreur && <p role="alert" className="text-red-500 text-sm">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={envoi} className="rounded-full bg-navy px-5 py-2.5 font-bold text-white transition-colors hover:bg-nuit disabled:opacity-50">
          {envoi ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onAnnuler} className="rounded-full border-2 border-line bg-white px-5 py-2 font-semibold text-nuit hover:border-royal">
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
        <Link href="/admin/evaluations" className="text-sm font-semibold text-royal">← Évaluations</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-nuit mt-2">{titre || 'Évaluation'}</h1>
        <p className="text-sm text-ardoise-texte mt-1">
          {questions.length} question{questions.length > 1 ? 's' : ''}. Les élèves ne voient les bonnes réponses
          qu&apos;après avoir terminé. Durée : 30 minutes, une seule tentative.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className={`text-sm font-bold ${publiee ? 'text-green-700' : 'text-ardoise-texte'}`}>
            {publiee ? 'Publiée : visible par les élèves concernés' : 'Brouillon : invisible pour les élèves'}
          </span>
          <button onClick={basculerPublication} className="rounded-full border-2 border-navy px-4 py-1.5 font-semibold text-navy hover:bg-navy hover:text-white text-sm">
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
          className="self-start rounded-full bg-navy px-5 py-2.5 font-bold text-white transition-colors hover:bg-nuit"
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
            <div key={q.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line flex flex-col gap-2">
              <p className="font-medium">{i + 1}. {q.question}</p>
              <ul className="text-sm flex flex-col gap-1">
                {q.choices.map((c) => (
                  <li key={c} className={c === q.correct_answer ? 'text-green-700 font-bold' : 'text-ardoise-texte'}>
                    {c === q.correct_answer ? '✓ ' : '• '}{c}
                  </li>
                ))}
              </ul>
              {q.explication && <p className="text-sm text-ardoise-texte">Explication : {q.explication}</p>}
              {!q.correct_answer && (
                <p className="text-sm text-red-500">Aucune bonne réponse définie : modifie cette question.</p>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                <button onClick={() => deplacer(q.id, -1)} disabled={i === 0} aria-label={`Monter la question ${i + 1}`} className="rounded-full border-2 border-line bg-white px-4 py-1.5 font-semibold text-nuit hover:border-royal disabled:opacity-30">↑</button>
                <button onClick={() => deplacer(q.id, 1)} disabled={i === questions.length - 1} aria-label={`Descendre la question ${i + 1}`} className="rounded-full border-2 border-line bg-white px-4 py-1.5 font-semibold text-nuit hover:border-royal disabled:opacity-30">↓</button>
                <button onClick={() => setEdition(q.id)} className="rounded-full border-2 border-navy px-4 py-1.5 font-semibold text-navy hover:bg-navy hover:text-white">Modifier</button>
                <button onClick={() => supprimer(q, i + 1)} className="rounded-full border-2 border-red-500 px-4 py-1.5 font-semibold text-red-600 hover:bg-red-50">Supprimer</button>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-nuit">Résultats des élèves</h2>
        {resultats.length === 0 && <p className="text-sm text-ardoise-texte">Personne n&apos;a encore passé cette évaluation.</p>}
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
