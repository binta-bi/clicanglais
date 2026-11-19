import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AccesCours from '@/components/AccesCours'
import AvisCours from '@/components/Avis'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'

const PHOTO: Record<string, string> = {
  debutant: '/niveau-debutant.jpg',
  intermediaire: '/niveau-intermediaire.jpg',
  avance: '/niveau-avance.jpg',
}

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

  const photo = PHOTO[course.niveau as string] ?? PHOTO.debutant
  const liste = (
    <ol className="flex flex-col gap-2">
      {titres.map((t, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl bg-ivoire px-3 py-2.5 ring-1 ring-nuit/10">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cuivre text-sm font-extrabold text-nuit">
            {i + 1}
          </span>
          <span className="font-medium text-nuit">{t}</span>
        </li>
      ))}
    </ol>
  )

  return (
    <div className="hero-ivoire min-h-[calc(100dvh-4.2rem)] pb-16">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-royal to-nuit sm:h-60">
        <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/70 to-nuit/30" />
        <div className="relative mx-auto flex h-full max-w-2xl flex-col justify-end gap-2 px-4 pb-6 text-white">
          <Link href="/cours" className="text-sm font-semibold text-white/85 hover:text-white">
            ← Retour aux cours
          </Link>
          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{course.title}</h1>
          <p className="text-white/85">
            Niveau {nomNiveau}
            {course.mois ? ` · Mois ${course.mois} sur 3` : ''}
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-4 flex max-w-2xl flex-col gap-6 px-4">
        <div className="rounded-3xl bg-white p-6 shadow-[0_24px_50px_-34px_rgb(20_36_58/0.5)] ring-1 ring-nuit/10 sm:p-8">
          {course.description && <p className="leading-relaxed text-ardoise-texte">{course.description}</p>}

          <h2 className="mb-3 mt-6 text-xl font-extrabold text-nuit">
            {mises.length > 0 ? 'Leçons du cours' : 'Programme du mois'}
          </h2>
          {titres.length === 0 ? (
            <p className="text-ardoise-texte">Leçons bientôt disponibles.</p>
          ) : titres.length > 6 ? (
            <details className="group">
              <summary className="mb-3 cursor-pointer list-none font-bold text-royal">
                <span className="group-open:hidden">Voir les {titres.length} leçons ▾</span>
                <span className="hidden group-open:inline">Masquer les leçons ▴</span>
              </summary>
              {liste}
            </details>
          ) : (
            liste
          )}
        </div>

        <AccesCours courseId={course.id} prix={Number(course.price)} niveau={course.niveau as NiveauSlug} vendable={course.mois !== null} />

        <AvisCours courseId={course.id} />
      </div>
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
