'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Ligne = {
  id: string
  rating: number | null
  content: string
  created_at: string
  courses: { title: string } | null
  profiles: { full_name: string | null } | null
}

export default function AdminAvis() {
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [pret, setPret] = useState(false)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, content, created_at, courses(title), profiles(full_name)')
      .order('created_at', { ascending: false })
    if (error) setErreur(error.message)
    setLignes((data as unknown as Ligne[]) || [])
    setPret(true)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function supprimer(l: Ligne) {
    if (!window.confirm('Supprimer cet avis définitivement ?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', l.id)
    if (error) {
      setErreur(error.message)
      return
    }
    setErreur('')
    charger()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Avis des élèves</h1>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      {!pret && <p>Chargement...</p>}
      {pret && lignes.length === 0 && <p className="text-gray-500">Aucun avis pour l&apos;instant.</p>}
      <ul className="flex flex-col gap-3">
        {lignes.map((l) => (
          <li key={l.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
              <p>
                <strong className="text-base text-black">{l.profiles?.full_name || 'Élève'}</strong>
                {' · '}
                {l.courses?.title || 'Cours supprimé'}
                {l.rating ? ` · ${l.rating}/5` : ''}
              </p>
              <p>{new Date(l.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <p className="mt-2 whitespace-pre-line break-words">{l.content}</p>
            <button
              onClick={() => supprimer(l)}
              className="mt-3 rounded border border-red-500 px-3 py-1 text-sm text-red-500"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
