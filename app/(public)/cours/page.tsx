'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Course = {
  id: string
  title: string
  description: string
  niveau: 'debutant' | 'intermediaire' | 'avance'
  price: number
}

const niveaux = [
  { value: 'tous', label: 'Tous' },
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
]

export default function Catalogue() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filtre, setFiltre] = useState('tous')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      const { data } = await supabase
        .from('courses')
        .select('id, title, description, niveau, price')
        .eq('is_published', true)
        .order('created_at')
      setCourses(data || [])
      setLoading(false)
    }
    loadCourses()
  }, [])

  const visibles =
    filtre === 'tous' ? courses : courses.filter((c) => c.niveau === filtre)

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Nos cours</h1>

      <div className="flex gap-2 flex-wrap">
        {niveaux.map((n) => (
          <button
            key={n.value}
            onClick={() => setFiltre(n.value)}
            className={`px-3 py-1 rounded border ${
              filtre === n.value ? 'bg-blue-900 text-white' : ''
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {loading && <p>Chargement des cours...</p>}
      {!loading && visibles.length === 0 && <p>Aucun cours pour ce niveau.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {visibles.map((c) => (
           <Link href={`/cours/${c.id}`} key={c.id} className="border rounded p-4 flex flex-col gap-2 hover:shadow">
            <h2 className="font-bold">{c.title}</h2>
            <p className="text-sm">{c.description}</p>
            <p className="text-sm text-gray-500">Niveau : {c.niveau}</p>
            <p className="font-medium">{c.price.toLocaleString('fr-FR')} GNF</p>
          </Link>
        ))}
      </div>
    </div>
  )
}