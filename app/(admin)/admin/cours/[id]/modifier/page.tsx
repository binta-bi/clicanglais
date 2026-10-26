'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ModifierCours() {
  const { id } = useParams<{ id: string }>()
  const [chargement, setChargement] = useState(true)
  const [introuvable, setIntrouvable] = useState(false)
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [prix, setPrix] = useState('')
  const [programme, setProgramme] = useState('')
  const [publie, setPublie] = useState(false)
  const [nbLecons, setNbLecons] = useState(0)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    async function charger() {
      const { data: c } = await supabase
        .from('courses')
        .select('title, description, price, programme, is_published')
        .eq('id', id)
        .single()
      if (!c) {
        setIntrouvable(true)
        setChargement(false)
        return
      }
      setTitre(c.title || '')
      setDescription(c.description || '')
      setPrix(String(c.price ?? 0))
      setProgramme(Array.isArray(c.programme) ? (c.programme as string[]).join('\n') : '')
      setPublie(!!c.is_published)
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', id)
      setNbLecons(count || 0)
      setChargement(false)
    }
    charger()
  }, [id])

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setErreur('')
    const montant = Number(prix)
    if (!Number.isFinite(montant) || montant < 0 || !Number.isInteger(montant)) {
      setErreur('Le prix doit être un nombre entier en FCFA (0 ou plus).')
      return
    }
    setEnvoi(true)
    const { error } = await supabase
      .from('courses')
      .update({
        title: titre.trim(),
        description: description.trim(),
        price: montant,
        programme: programme
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        is_published: publie,
      })
      .eq('id', id)
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    setMessage('Modifications enregistrées.')
  }

  if (chargement) return <p className="text-center mt-10">Chargement...</p>
  if (introuvable) return <p className="text-center mt-10">Cours introuvable.</p>

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <Link href={`/admin/cours/${id}`} className="text-sm text-[#2d3a6b]">← Leçons du cours</Link>
        <h1 className="text-2xl font-bold mt-2">Modifier le cours</h1>
      </div>

      <form onSubmit={enregistrer} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Titre
          <input
            value={titre} required onChange={(e) => setTitre(e.target.value)}
            className="border p-2 rounded font-normal"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Description
          <textarea
            value={description} rows={3} onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded font-normal"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Prix (FCFA)
          <input
            type="number" min={0} step={1} value={prix} required
            onChange={(e) => setPrix(e.target.value)}
            className="border p-2 rounded font-normal"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Programme (une leçon par ligne)
          <textarea
            value={programme} rows={10} onChange={(e) => setProgramme(e.target.value)}
            className="border p-2 rounded font-normal"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={publie} onChange={(e) => setPublie(e.target.checked)} />
          Cours publié (visible par les élèves)
        </label>
        {publie && nbLecons === 0 && (
          <p className="text-sm text-orange-600">
            Attention : ce cours n&apos;a encore aucune leçon. Les élèves pourraient l&apos;acheter sans rien voir.
          </p>
        )}

        {erreur && <p role="alert" className="text-red-500 text-sm">{erreur}</p>}
        {message && <p role="status" className="text-green-700 text-sm">{message}</p>}

        <button type="submit" disabled={envoi} className="bg-[#2d3a6b] text-white p-2 rounded disabled:opacity-50">
          {envoi ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}

export default function PageModifierCours() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Chargement...</p>}>
      <ModifierCours />
    </Suspense>
  )
}
