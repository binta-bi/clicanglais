import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AccesCours from '@/components/AccesCours'
import AvisCours from '@/components/Avis'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

async function Contenu({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, niveau, mois, price, programme')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: lessons } = await supabase
    .from('lessons_public')
    .select('id, title, position')
    .eq('course_id', id)
    .order('position')

  // Titres des leçons mises en ligne, sinon le programme prévu pour le mois
  const mises = (lessons ?? []).map((l) => l.title as string)
  const prevues: string[] = Array.isArray(course.programme) ? course.programme : []
  const titres = mises.length > 0 ? mises : prevues
  const nomNiveau = NOM_NIVEAU[course.niveau as NiveauSlug] ?? course.niveau

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 pb-16 flex flex-col gap-6">
      <Link href="/cours" className="text-sm text-[#2d3a6b]">
        ← Retour aux cours
      </Link>
      <h1 className="text-3xl font-bold text-[#2d3a6b]">{course.title}</h1>
      <p className="text-gray-500">
        Niveau {nomNiveau}
        {course.mois ? ` · Mois ${course.mois} sur 3` : ''}
      </p>
      <p>{course.description}</p>

      <div>
        <h2 className="text-xl font-bold mb-2">
          {mises.length > 0 ? 'Leçons du cours' : 'Programme du mois'}
        </h2>
        {titres.length > 0 ? (
          <ol className="list-decimal pl-5 flex flex-col gap-1">
            {titres.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500">Leçons bientôt disponibles.</p>
        )}
      </div>

      <AccesCours courseId={course.id} prix={Number(course.price)} niveau={course.niveau as NiveauSlug} vendable={course.mois !== null} />

      <AvisCours courseId={course.id} />
    </div>
  )
}

// params est lu sous <Suspense> pour que le site se compile en production
export default function FicheCours({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<p className="text-center mt-10">Chargement...</p>}>
      <Contenu params={params} />
    </Suspense>
  )
}
