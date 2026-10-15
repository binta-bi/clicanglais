'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Course = {
  id: string
  title: string
  description: string | null
  niveau: string
  price: number
  is_published: boolean
}

export default function AdminCours() {
  const [courses, setCourses] = useState<Course[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [niveau, setNiveau] = useState('debutant')
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')

  async function charger() {
    const { data } = await supabase
      .from('courses')
      .select('id, title, description, niveau, price, is_published')
      .order('created_at', { ascending: false })
    setCourses(data || [])
  }

  useEffect(() => {
    charger()
  }, [])

  async function creer(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    const { error } = await supabase.from('courses').insert({
      title,
      description,
      niveau,
      price: Number(price),
      is_published: false,
    })
    if (error) {
      setMessage(error.message)
      return
    }
    setTitle('')
    setDescription('')
    setPrice('')
    charger()
  }

  async function basculer(c: Course) {
    await supabase.from('courses').update({ is_published: !c.is_published }).eq('id', c.id)
    charger()
  }

  async function supprimer(c: Course) {
    if (!confirm(`Supprimer « ${c.title} » et toutes ses leçons ?`)) return
    await supabase.from('courses').delete().eq('id', c.id)
    charger()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin" className="text-sm text-[#2d3a6b]">← Espace professeur</Link>
        <h1 className="text-2xl font-bold mt-2">Mes cours</h1>
      </div>

      <form onSubmit={creer} className="border rounded p-4 flex flex-col gap-3 max-w-xl">
        <h2 className="font-bold">Nouveau cours</h2>
        <input
          placeholder="Titre" value={title} required
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="Description" value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded" rows={3}
        />
        <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="border p-2 rounded">
          <option value="debutant">Débutant</option>
          <option value="intermediaire">Intermédiaire</option>
          <option value="avance">Avancé</option>
        </select>
        <input
          type="number" min="0" placeholder="Prix (GNF)" value={price} required
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 rounded"
        />
        {message && <p className="text-red-500 text-sm">{message}</p>}
        <button type="submit" className="bg-[#2d3a6b] text-white p-2 rounded">
          Créer le cours (en brouillon)
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {courses.length === 0 && <p className="text-gray-500">Aucun cours pour l&apos;instant.</p>}
        {courses.map((c) => (
          <div key={c.id} className="border rounded p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">{c.title}</p>
              <p className="text-sm text-gray-500">
                {c.niveau} · {c.price.toLocaleString('fr-FR')} GNF ·{' '}
                <span className={c.is_published ? 'text-green-600' : 'text-gray-500'}>
                  {c.is_published ? 'Publié' : 'Brouillon'}
                </span>
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => basculer(c)} className="border px-3 py-1 rounded">
                {c.is_published ? 'Dépublier' : 'Publier'}
              </button>
              <button onClick={() => supprimer(c)} className="border border-red-500 text-red-500 px-3 py-1 rounded">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}