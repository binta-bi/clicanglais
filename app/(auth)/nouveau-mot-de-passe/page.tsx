'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthCarte, AuthShell, AuthTitre, Champ, ChampMotDePasse, IconeRonde, MessageErreur } from '@/components/AuthShell'

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

  if (etat === 'attente') {
    return (
      <AuthShell>
        <p role="status" className="py-16 text-center text-lg text-ardoise-texte">
          Vérification du lien...
        </p>
      </AuthShell>
    )
  }

  if (etat === 'invalide') {
    return (
      <AuthShell>
        <AuthCarte>
          <IconeRonde>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.2v.1" />
          </IconeRonde>
          <AuthTitre
            titre="Lien invalide ou expiré"
            sous="Ce lien ne fonctionne plus. Demande-en un nouveau, il est valable peu de temps et une seule fois."
          />
          <Link href="/mot-de-passe-oublie" className="btn-hero w-full">
            Demander un nouveau lien
          </Link>
        </AuthCarte>
      </AuthShell>
    )
  }

  if (etat === 'fait') {
    return (
      <AuthShell>
        <AuthCarte>
          <IconeRonde>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12.3 2.8 2.8L16.2 9.5" />
          </IconeRonde>
          <AuthTitre titre="Mot de passe modifié" />
          <p role="status" className="rounded-xl bg-mist p-4 font-medium ring-1 ring-line">
            Ton nouveau mot de passe est enregistré. Tu es connecté.
          </p>
          <Link href="/mes-cours" className="btn-hero mt-6 w-full">
            Aller à mes cours
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
            <AuthTitre titre="Nouveau mot de passe" />
          </div>
          <Champ id="nmdp" label="Nouveau mot de passe (8 caractères minimum)">
            <ChampMotDePasse id="nmdp" value={mdp} onChange={setMdp} minLength={8} autoComplete="new-password" />
          </Champ>
          <Champ id="cmdp" label="Répète le mot de passe">
            <ChampMotDePasse id="cmdp" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
          </Champ>
          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          <button type="submit" disabled={envoi} className="btn-hero w-full">
            {envoi ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </AuthCarte>
    </AuthShell>
  )
}
