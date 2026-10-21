'use client'
import Link from 'next/link'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  const videoRef = useRef<HTMLVideoElement>(null)
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

  return (
    <div className="max-w-5xl mx-auto mt-6 px-4 flex flex-col gap-4">
      <Link href="/mes-cours" className="text-sm text-[#2d3a6b]">← Mes cours</Link>
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <p className="text-sm text-gray-500">
        {vues.length} / {lessons.length} leçons vues
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-4">
          <video
            key={lesson.id}
            ref={videoRef}
            src={lesson.video_url}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={(e) => setTemps(e.currentTarget.currentTime)}
            onEnded={() => marquerVue(lesson.id)}
            className="w-full rounded bg-black"
          />

          <div className="border rounded p-3 max-h-64 overflow-y-auto flex flex-col gap-1">
            {segments.length === 0 && (
              <p className="text-gray-500 text-sm">Pas de transcription pour cette leçon.</p>
            )}
            {segments.map((s, i) => {
              const actif = temps >= s.start && temps < s.end
              return (
                <button
                  key={i}
                  ref={actif ? actifRef : null}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = s.start
                      videoRef.current.play()
                    }
                  }}
                  className={`text-left p-2 rounded ${
                    actif ? 'bg-[#e8652d] text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {s.text}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border rounded p-3 flex flex-col gap-1 h-fit">
          <h2 className="font-bold mb-1">Leçons</h2>
          {lessons.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setCurrent(i)}
              className={`text-left p-2 rounded ${
                i === current ? 'bg-[#2d3a6b] text-white' : 'hover:bg-gray-100'
              }`}
            >
              {vues.includes(l.id) ? '✓ ' : ''}{l.title}
            </button>
          ))}
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
