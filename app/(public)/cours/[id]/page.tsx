import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function FicheCours({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, niveau, price')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: lessons } = await supabase
    .from('lessons_public')
    .select('id, title, position')
    .eq('course_id', id)
    .order('position')

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 flex flex-col gap-6">
      <Link href="/cours" className="text-sm text-[#2d3a6b]">
        ← Retour aux cours
      </Link>
      <h1 className="text-3xl font-bold text-[#2d3a6b]">{course.title}</h1>
      <p className="text-gray-500">Niveau : {course.niveau}</p>
      <p>{course.description}</p>

      <div>
        <h2 className="text-xl font-bold mb-2">Contenu du cours</h2>
        {lessons && lessons.length > 0 ? (
          <ol className="list-decimal pl-5 flex flex-col gap-1">
            {lessons.map((l) => (
              <li key={l.id}>{l.title}</li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500">Leçons bientôt disponibles.</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <p className="text-2xl font-bold">
          {course.price.toLocaleString('fr-FR')} GNF
        </p>
        <button
          disabled
          className="bg-[#e8652d] text-white px-5 py-2 rounded opacity-60"
        >
          Acheter (bientôt)
        </button>
      </div>
    </div>
  )
}