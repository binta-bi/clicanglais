'use client'
import Link from 'next/link'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LecteurVideo, { type CommandesLecteur } from '@/components/LecteurVideo'

type Segment = { start: number; end: number; text: string }
type Lesson = {
  id: string
  title: string
  video_url: string
  transcription: Segment[] | null
}

function Lecteur() {
  const { id } = useParams<{ id: string }>()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [current, setCurrent] = useState(0)
  const [vues, setVues] = useState<string[]>([])
  const [temps, setTemps] = useState(0)
  const [loading, setLoading] = useState(true)
  const lecteurRef = useRef<CommandesLecteur>(null)
  const actifRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, video_url, transcription')
        .eq('course_id', id)
        .order('position')
      setLessons((data as Lesson[]) || [])

      const { data: prog } = await supabase
        .from('progress')
        .select('lesson_id')
        .eq('completed', true)
      setVues((prog || []).map((p) => p.lesson_id))
      setLoading(false)
    }
    load()
  }, [id])

  // Fait défiler la transcription vers la phrase en cours
  useEffect(() => {
    actifRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [temps])

  async function marquerVue(lessonId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('progress').upsert(
      { student_id: user.id, lesson_id: lessonId, completed: true },
      { onConflict: 'student_id,lesson_id' }
    )
    setVues((v) => (v.includes(lessonId) ? v : [...v, lessonId]))
  }

  if (loading) return <p className="text-center mt-10">Chargement...</p>
  if (lessons.length === 0)
    return <p className="text-center mt-10">Aucune leçon accessible pour ce cours.</p>

  const lesson = lessons[current]
  const segments = lesson.transcription || []

  const pct = Math.round((vues.filter((v) => lessons.some((l) => l.id === v)).length / lessons.length) * 100)

  return (
    <div className="hero-ivoire min-h-[calc(100dvh-4.2rem)] pb-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-6">
        <Link href="/mes-cours" className="text-sm font-semibold text-royal">← Mes cours</Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-nuit sm:text-3xl">{lesson.title}</h1>
        <div>
          <p className="text-sm text-ardoise-texte">
            {vues.length} / {lessons.length} leçons vues
          </p>
          <div className="mt-1 h-2 max-w-xs overflow-hidden rounded-full bg-white ring-1 ring-nuit/10" aria-hidden="true">
            <div className="h-full rounded-full bg-cuivre" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 flex flex-col gap-4">
            <LecteurVideo
              key={lesson.id}
              ref={lecteurRef}
              url={lesson.video_url}
              onTemps={setTemps}
              onFin={() => marquerVue(lesson.id)}
            />

            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-2xl bg-white p-3 ring-1 ring-nuit/10">
              {segments.length === 0 && (
                <p className="text-sm text-ardoise-texte">Pas de transcription pour cette leçon.</p>
              )}
              {segments.map((s, i) => {
                const actif = temps >= s.start && temps < s.end
                return (
                  <button
                    key={i}
                    ref={actif ? actifRef : null}
                    onClick={() => lecteurRef.current?.chercher(s.start)}
                    className={`rounded-lg p-2 text-left ${
                      actif ? 'bg-nuit text-white' : 'hover:bg-mist'
                    }`}
                  >
                    {s.text}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex h-fit flex-col gap-1 rounded-2xl bg-white p-3 ring-1 ring-nuit/10">
            <h2 className="mb-1 font-extrabold text-nuit">Leçons</h2>
            {lessons.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setCurrent(i)}
                className={`rounded-lg p-2 text-left ${
                  i === current ? 'bg-nuit font-bold text-white' : 'hover:bg-mist'
                }`}
              >
                {vues.includes(l.id) ? '✓ ' : ''}{l.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// useParams() doit être lu sous <Suspense> pour que le site se compile en production
export default function PageLecteur() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Chargement...</p>}>
      <Lecteur />
    </Suspense>
  )
}
