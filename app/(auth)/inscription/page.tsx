'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Inscription() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/test-placement')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <input
        type="text" placeholder="Nom complet" value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="border p-2 rounded" required
      />
      <input
        type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded" required
      />
      <input
        type="password" placeholder="Mot de passe" value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded" required
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" className="bg-blue-900 text-white p-2 rounded">
        S'inscrire
      </button>
    </form>
  )
}