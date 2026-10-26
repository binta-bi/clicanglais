'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Etat = 'attente' | 'pret' | 'invalide' | 'fait'

export default function NouveauMotDePasse() {
  const [etat, setEtat] = useState<Etat>('attente')
  const [mdp, setMdp] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    // Lien expiré ou déjà utilisé : Supabase l'indique dans l'adresse
    if (/error(_code|_description)?=/.test(window.location.hash + window.location.search)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEtat('invalide')
      return
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setEtat('pret')
      }
    })
    // Laisse le temps à Supabase de lire le lien, puis conclut s'il n'y a aucune session
    const t = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setEtat((e) => (e === 'attente' ? (session ? 'pret' : 'invalide') : e))
    }, 2500)
    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    if (mdp.length < 8) {
      setErreur('Le mot de passe doit avoir au moins 8 caractères.')
      return
    }
    if (mdp !== confirmation) {
      setErreur('Les deux mots de passe ne sont pas identiques.')
      return
    }
    setEnvoi(true)
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    setEtat('fait')
  }

  const champ = 'rounded-xl border-2 border-line px-4 py-3 text-base'

  if (etat === 'attente') {
    return (
      <p role="status" className="mx-auto mt-16 max-w-md px-5 text-center text-lg">
        Vérification du lien...
      </p>
    )
  }

  if (etat === 'invalide') {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
        <h1 className="text-3xl font-extrabold tracking-tight">Lien invalide ou expiré</h1>
        <p>Ce lien ne fonctionne plus. Demande-en un nouveau, il est valable peu de temps et une seule fois.</p>
        <Link href="/mot-de-passe-oublie" className="btn-primary w-fit">
          Demander un nouveau lien
        </Link>
      </div>
    )
  }

  if (etat === 'fait') {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
        <h1 className="text-3xl font-extrabold tracking-tight">Mot de passe modifié</h1>
        <p role="status" className="rounded-xl bg-mist p-4 font-medium">
          Ton nouveau mot de passe est enregistré. Tu es connecté.
        </p>
        <Link href="/mes-cours" className="btn-primary w-fit">
          Aller à mes cours
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Nouveau mot de passe</h1>
      <label className="flex flex-col gap-1 font-medium">
        Nouveau mot de passe (8 caractères minimum)
        <input
          type="password"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          className={champ}
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Répète le mot de passe
        <input
          type="password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className={champ}
          autoComplete="new-password"
          required
        />
      </label>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      <button type="submit" disabled={envoi} className="btn-primary disabled:opacity-50">
        {envoi ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
      </button>
    </form>
  )
}
