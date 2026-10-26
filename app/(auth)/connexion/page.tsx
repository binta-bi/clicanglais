'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setErreur(error?.message ?? 'Connexion impossible.')
      setEnvoi(false)
      return
    }
    // Le professeur va dans son espace ; un élève sans niveau choisit son point de départ
    const { data: profil } = await supabase
      .from('profiles')
      .select('role, niveau')
      .eq('id', data.user.id)
      .single()
    router.push(profil?.role === 'professeur' ? '/admin' : profil?.niveau ? '/mes-cours' : '/niveau')
  }

  const champ = 'rounded-xl border-2 border-line px-4 py-3 text-base'

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Se connecter</h1>
      <label className="flex flex-col gap-1 font-medium">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} required />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Mot de passe
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={champ} required />
      </label>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      <button type="submit" disabled={envoi} className="btn-primary disabled:opacity-50">
        {envoi ? 'Connexion...' : 'Se connecter'}
      </button>
      <Link href="/mot-de-passe-oublie" className="font-medium underline">
        Mot de passe oublié ?
      </Link>
      <p>
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-bold underline">
          S’inscrire
        </Link>
      </p>
    </form>
  )
}
