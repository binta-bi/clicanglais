'use client'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthCarte, AuthShell, AuthTitre, Champ, IconeRonde, MessageErreur } from '@/components/AuthShell'

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

  if (envoye) {
    return (
      <AuthShell>
        <AuthCarte>
          <IconeRonde>
            <path d="M3 6.5h18v11H3zM3 7l9 6.5L21 7" />
          </IconeRonde>
          <AuthTitre titre="Vérifie ta boîte mail" />
          <p role="status" className="rounded-xl bg-mist p-4 font-medium ring-1 ring-line">
            Si un compte existe avec l&apos;adresse {email}, tu vas recevoir un email avec un lien pour choisir un
            nouveau mot de passe. Pense à regarder dans les courriers indésirables.
          </p>
          <Link href="/connexion" className="mt-6 inline-block font-bold text-royal underline-offset-4 hover:underline">
            Retour à la connexion
          </Link>
        </AuthCarte>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthCarte>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <IconeRonde>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </IconeRonde>
            <AuthTitre
              titre="Mot de passe oublié"
              sous="Écris l'adresse email de ton compte. Nous t'envoyons un lien pour choisir un nouveau mot de passe."
            />
          </div>
          <Champ id="email" label="Email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="champ-auth"
              required
            />
          </Champ>
          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          <button type="submit" disabled={envoi} className="btn-hero w-full">
            {envoi ? 'Envoi...' : 'Envoyer le lien'}
          </button>
          <Link href="/connexion" className="text-center text-sm font-semibold text-royal underline-offset-4 hover:underline">
            Retour à la connexion
          </Link>
        </form>
      </AuthCarte>
    </AuthShell>
  )
}
