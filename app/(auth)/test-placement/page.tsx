'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Question = {
  id: string
  question: string
  choices: string[]
  correct_answer: string
}

export default function TestPlacement() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadQuestions() {
      const { data } = await supabase
        .from('placement_questions')
        .select('id, question, choices, correct_answer')
      setQuestions(data || [])
      setLoading(false)
    }
    loadQuestions()
  }, [])

  function handleAnswer(questionId: string, choice: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }

  async function handleSubmit() {
    setSubmitting(true)

    const score = questions.filter(
      (q) => answers[q.id] === q.correct_answer
    ).length

    let niveau: 'debutant' | 'intermediaire' | 'avance' = 'debutant'
    if (score >= 4) niveau = 'avance'
    else if (score >= 2) niveau = 'intermediaire'

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('placement_results').insert({
        student_id: user.id,
        score,
        niveau_attribue: niveau,
      })
      await supabase.from('profiles').update({ niveau }).eq('id', user.id)
    }

    router.push(`/resultat-test?niveau=${niveau}&score=${score}`)
  }

  if (loading) return <p className="text-center mt-10">Chargement du test...</p>

  return (
    <div className="max-w-xl mx-auto mt-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Test de placement</h1>
      {questions.map((q, i) => (
        <div key={q.id} className="border p-4 rounded">
          <p className="font-medium mb-2">{i + 1}. {q.question}</p>
          <div className="flex flex-col gap-2">
            {q.choices.map((choice) => (
              <label key={choice} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={q.id}
                  value={choice}
                  checked={answers[q.id] === choice}
                  onChange={() => handleAnswer(q.id, choice)}
                />
                {choice}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={submitting || Object.keys(answers).length < questions.length}
        className="bg-blue-900 text-white p-2 rounded disabled:opacity-50"
      >
        {submitting ? 'Envoi...' : 'Valider mes réponses'}
      </button>
    </div>
  )
}