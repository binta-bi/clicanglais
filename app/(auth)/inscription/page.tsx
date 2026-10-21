'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Inscription() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setMessage('')
    setEnvoi(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
    } else if (!data.session) {
      setMessage('Compte créé. Vérifie ta boîte email pour confirmer ton adresse, puis connecte-toi.')
    } else {
      router.push('/niveau')
    }
  }

  const champ = 'rounded-xl border-2 border-line px-4 py-3 text-base'

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Créer un compte</h1>
      <label className="flex flex-col gap-1 font-medium">
        Nom complet
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={champ} required />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} required />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Mot de passe
        <input
          type="password"
          value={password}
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          className={champ}
          required
        />
      </label>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-mist p-3 font-medium">
          {message}
        </p>
      )}
      <button type="submit" disabled={envoi} className="btn-primary disabled:opacity-50">
        {envoi ? 'Création...' : 'S’inscrire'}
      </button>
      <p>
        Tu as déjà un compte ?{' '}
        <Link href="/connexion" className="font-bold underline">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
