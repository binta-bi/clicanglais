'use client'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
    })
    setEnvoi(false)
    // Même message que l'adresse existe ou non : on ne révèle pas qui a un compte
    if (error && error.status !== 400 && error.status !== 422) {
      setErreur('L’envoi a échoué. Réessaie dans quelques minutes.')
      return
    }
    setEnvoye(true)
  }

  const champ = 'rounded-xl border-2 border-line px-4 py-3 text-base'

  if (envoye) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
        <h1 className="text-3xl font-extrabold tracking-tight">Vérifie ta boîte mail</h1>
        <p role="status" className="rounded-xl bg-mist p-4 font-medium">
          Si un compte existe avec l&apos;adresse {email}, tu vas recevoir un email avec un lien pour choisir un
          nouveau mot de passe. Pense à regarder dans les courriers indésirables.
        </p>
        <Link href="/connexion" className="font-bold underline">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Mot de passe oublié</h1>
      <p>Écris l&apos;adresse email de ton compte. Nous t&apos;envoyons un lien pour choisir un nouveau mot de passe.</p>
      <label className="flex flex-col gap-1 font-medium">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} required />
      </label>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      <button type="submit" disabled={envoi} className="btn-primary disabled:opacity-50">
        {envoi ? 'Envoi...' : 'Envoyer le lien'}
      </button>
      <Link href="/connexion" className="font-bold underline">
        Retour à la connexion
      </Link>
    </form>
  )
}
